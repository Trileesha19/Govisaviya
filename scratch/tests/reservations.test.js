import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { cpSync, mkdtempSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import jwt from 'jsonwebtoken';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const scratchRoot = realpathSync(path.join(projectRoot, 'scratch'));
const fixtureRoot = mkdtempSync(path.join(scratchRoot, '.reservation-test-'));
const fixtureServer = path.join(fixtureRoot, 'server');
const testSecret = 'isolated-reservation-regression-test-secret';
let db;
let router;
let farmer;
let otherFarmer;
let buyer;

function tokenFor(user) {
  return jwt.sign(user, testSecret, { expiresIn: '5m' });
}

function request(endpoint, user, body) {
  // Dispatch through the real Express router and authentication middleware,
  // without requiring a network socket in restricted test environments.
  return new Promise((resolve, reject) => {
    let statusCode = 200;
    const req = {
      method: endpoint.endsWith('/status') ? 'PUT' : 'POST',
      url: endpoint,
      headers: { authorization: `Bearer ${tokenFor(user)}` },
      body
    };
    const res = {
      status(code) { statusCode = code; return this; },
      json(data) { resolve({ status: statusCode, body: data }); }
    };
    router(req, res, error => reject(error || new Error(`No route handled ${endpoint}`)));
  });
}

async function createReservation(quantity = 25) {
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO listings
      (farmer_id, crop_name, quantity, initial_quantity, unit, price, location)
    VALUES (?, 'Regression-test carrots', 100, 100, 'kg', 200, 'Test farm')
  `).run(farmer.id);
  const result = await request('/', buyer, {
    listing_id: lastInsertRowid,
    reserved_quantity: quantity
  });
  assert.equal(result.status, 201);
  assert.equal(result.body.reservation.status, 'pending');
  assert.equal(result.body.remainingQuantity, 100 - quantity);
  return { reservationId: result.body.reservation.id, listingId: lastInsertRowid };
}

function stateOf(fixture) {
  return {
    listing: db.prepare('SELECT quantity, status FROM listings WHERE id = ?').get(fixture.listingId),
    reservation: db.prepare('SELECT status FROM reservations WHERE id = ?').get(fixture.reservationId),
    notifications: db.prepare('SELECT COUNT(*) AS count FROM messages WHERE listing_id = ?').get(fixture.listingId).count
  };
}

before(async () => {
  // Copy source only: the application database is never opened by this suite.
  cpSync(path.join(projectRoot, 'server'), fixtureServer, {
    recursive: true,
    filter: source => statSync(source).isDirectory() || source.endsWith('.js')
  });
  writeFileSync(path.join(fixtureRoot, 'package.json'), JSON.stringify({ type: 'module' }));

  const previousSecret = process.env.JWT_SECRET;
  const previousVercel = process.env.VERCEL;
  process.env.JWT_SECRET = testSecret;
  delete process.env.VERCEL;
  try {
    const database = await import(pathToFileURL(path.join(fixtureServer, 'database.js')).href);
    db = database.default;
    database.initDatabase();
    router = (await import(pathToFileURL(path.join(fixtureServer, 'routes/reservations.js')).href)).default;
  } finally {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
    if (previousVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = previousVercel;
  }

  function createUser(role, label) {
    const { lastInsertRowid } = db.prepare(`
      INSERT INTO users (name, email, password, role, location)
      VALUES (?, ?, 'unused-test-password-hash', ?, 'Test district')
    `).run(label, `${label}@test.example`, role);
    return { id: lastInsertRowid, name: label, role };
  }
  farmer = createUser('farmer', 'owner');
  otherFarmer = createUser('farmer', 'other-owner');
  buyer = createUser('buyer', 'buyer');

});

after(() => {
  if (db?.open) db.close();
  // Verify the resolved cleanup target is the specific disposable test fixture.
  const cleanupTarget = realpathSync(fixtureRoot);
  assert.equal(path.dirname(cleanupTarget), scratchRoot);
  assert.ok(path.basename(cleanupTarget).startsWith('.reservation-test-'));
  rmSync(cleanupTarget, { recursive: true, force: true });
});

test('accepting a pending reservation keeps its stock held and rejects later decisions', async () => {
  const fixture = await createReservation();
  const accepted = await request(`/${fixture.reservationId}/status`, farmer, { status: 'accepted' });
  assert.equal(accepted.status, 200);
  const expected = {
    listing: { quantity: 75, status: 'partially_reserved' },
    reservation: { status: 'accepted' },
    notifications: 1
  };
  assert.deepEqual(stateOf(fixture), expected);
  for (const status of ['accepted', 'denied']) {
    const repeated = await request(`/${fixture.reservationId}/status`, farmer, { status });
    assert.equal(repeated.status, 409);
    assert.match(repeated.body.error, /Only pending reservations/);
    assert.deepEqual(stateOf(fixture), expected);
  }
});

test('declining restores stock once and cannot be reaccepted or declined twice', async () => {
  const fixture = await createReservation();
  const declined = await request(`/${fixture.reservationId}/status`, farmer, { status: 'denied' });
  assert.equal(declined.status, 200);
  const expected = {
    listing: { quantity: 100, status: 'available' },
    reservation: { status: 'denied' },
    notifications: 1
  };
  assert.deepEqual(stateOf(fixture), expected);
  for (const status of ['denied', 'accepted']) {
    const repeated = await request(`/${fixture.reservationId}/status`, farmer, { status });
    assert.equal(repeated.status, 409);
    assert.deepEqual(stateOf(fixture), expected);
  }
});

test('competing accept and decline requests produce exactly one decision and notification', async () => {
  const fixture = await createReservation(100);
  const responses = await Promise.all([
    request(`/${fixture.reservationId}/status`, farmer, { status: 'accepted' }),
    request(`/${fixture.reservationId}/status`, farmer, { status: 'denied' })
  ]);
  assert.deepEqual(responses.map(response => response.status).sort(), [200, 409]);
  const finalState = stateOf(fixture);
  const accepted = finalState.reservation.status === 'accepted';
  assert.deepEqual(finalState.listing, accepted
    ? { quantity: 0, status: 'reserved' }
    : { quantity: 100, status: 'available' });
  assert.equal(finalState.notifications, 1);
});

test('a different farmer cannot make a decision or change stock', async () => {
  const fixture = await createReservation();
  const before = stateOf(fixture);
  const response = await request(`/${fixture.reservationId}/status`, otherFarmer, { status: 'denied' });
  assert.equal(response.status, 403);
  assert.deepEqual(stateOf(fixture), before);
});

test('JWT secret is loaded from .env before authentication middleware initializes', () => {
  const envSecret = 'isolated-dotenv-loading-regression-secret';
  writeFileSync(path.join(fixtureRoot, '.env'), `JWT_SECRET=${envSecret}\n`);
  const childEnv = { ...process.env, DOTENV_CONFIG_QUIET: 'true' };
  delete childEnv.JWT_SECRET;
  delete childEnv.DOTENV_CONFIG_PATH;
  const authUrl = pathToFileURL(path.join(fixtureServer, 'middleware/auth.js')).href;
  const script = `import { JWT_SECRET } from ${JSON.stringify(authUrl)}; process.stdout.write(JWT_SECRET);`;
  const result = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: fixtureRoot,
    env: childEnv,
    encoding: 'utf8'
  });
  assert.equal(result, envSecret);
});
