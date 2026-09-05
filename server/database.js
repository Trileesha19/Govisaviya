import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detect Vercel serverless lambda environment
const isVercel = !!process.env.VERCEL;
const dbDir = isVercel ? '/tmp' : __dirname;
const dbPath = path.join(dbDir, 'marketplace.db');

let db;
try {
  db = new Database(dbPath);
} catch (e) {
  // Fallback to /tmp if primary directory is read-only
  const fallbackPath = path.join('/tmp', 'marketplace.db');
  db = new Database(fallbackPath);
}

// Enable Foreign Key support
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('farmer', 'buyer')) NOT NULL,
      location TEXT NOT NULL,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmer_id INTEGER NOT NULL,
      crop_name TEXT NOT NULL,
      category TEXT DEFAULT 'Vegetable',
      quantity REAL NOT NULL CHECK(quantity >= 0),
      initial_quantity REAL NOT NULL CHECK(initial_quantity >= 0),
      unit TEXT NOT NULL,
      price REAL NOT NULL CHECK(price > 0),
      location TEXT NOT NULL,
      status TEXT CHECK(status IN ('available', 'partially_reserved', 'reserved')) DEFAULT 'available',
      description TEXT,
      harvest_date DATE,
      image_emoji TEXT DEFAULT '🌾',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL,
      buyer_id INTEGER NOT NULL,
      reserved_quantity REAL NOT NULL CHECK(reserved_quantity > 0),
      total_price REAL NOT NULL,
      reservation_method TEXT CHECK(reservation_method IN ('in_app', 'email')) DEFAULT 'in_app',
      notes TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
      FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmer_id INTEGER NOT NULL,
      buyer_id INTEGER NOT NULL,
      listing_id INTEGER,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmer_id INTEGER NOT NULL,
      buyer_id INTEGER NOT NULL,
      listing_id INTEGER,
      subject TEXT,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL
    );
  `);

  try {
    db.exec(`ALTER TABLE reservations ADD COLUMN reservation_method TEXT DEFAULT 'in_app'`);
  } catch (e) {
    // Column already exists
  }

  // Auto-seed if database is brand new in Vercel environment
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    autoSeedVercelData();
  }

  console.log(`✅ SQLite Database initialized at ${dbPath}`);
}

function autoSeedVercelData() {
  console.log('🌱 Auto-seeding Sri Lankan data on Vercel boot...');
  // Minimal auto seed helper if DB was created fresh in /tmp
  db.prepare(`
    INSERT OR IGNORE INTO users (id, name, email, password, role, location, phone)
    VALUES 
    (1, 'Sunil Wickramasinghe', 'farmer.sunil@agri.lk', '$2a$10$eE.r5o4uJc5Fz.4P6.jO5.9x4qW/O6Z3Dk1v5l8Q7m9N0P1R2S3T4', 'farmer', 'Nuwara Eliya', '+94 77 123 4567'),
    (2, 'Kamal Silva', 'farmer.kamal@agri.lk', '$2a$10$eE.r5o4uJc5Fz.4P6.jO5.9x4qW/O6Z3Dk1v5l8Q7m9N0P1R2S3T4', 'farmer', 'Dambulla', '+94 71 987 6543'),
    (3, 'Lanka Fresh Supermarket', 'buyer.supermarket@market.lk', '$2a$10$eE.r5o4uJc5Fz.4P6.jO5.9x4qW/O6Z3Dk1v5l8Q7m9N0P1R2S3T4', 'buyer', 'Colombo', '+94 11 234 5678');
  `).run();

  db.prepare(`
    INSERT OR IGNORE INTO listings (id, farmer_id, crop_name, category, quantity, initial_quantity, unit, price, location, status, description, image_emoji)
    VALUES 
    (1, 1, 'Fresh Nuwara Eliya Carrots', 'Vegetables', 500, 500, 'kg', 240, 'Nuwara Eliya', 'available', 'Crisp high-altitude organic carrots from Lovers Leap farm.', '🥕'),
    (2, 2, 'Dambulla Green Chili', 'Spices & Chili', 200, 200, 'kg', 480, 'Dambulla', 'available', 'Pungent hot green chili from Dambulla agricultural zone.', '🌶️');
  `).run();
}

export default db;
