import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
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
      status TEXT CHECK(status IN ('pending', 'accepted', 'denied')) DEFAULT 'pending',
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

  try {
    db.exec(`ALTER TABLE reservations ADD COLUMN status TEXT DEFAULT 'pending'`);
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
  try {
    const defaultPassword = bcrypt.hashSync('password123', 10);

    const farmers = [
      { id: 1, name: 'Sunil Wickramasinghe', email: 'farmer.sunil@agri.lk', password: defaultPassword, role: 'farmer', location: 'Nuwara Eliya', phone: '+94 77 123 4567' },
      { id: 2, name: 'Kamal Silva', email: 'farmer.kamal@agri.lk', password: defaultPassword, role: 'farmer', location: 'Dambulla', phone: '+94 71 987 6543' },
      { id: 3, name: 'Bandara Rajakaruna', email: 'farmer.bandara@agri.lk', password: defaultPassword, role: 'farmer', location: 'Polonnaruwa', phone: '+94 76 555 4321' },
      { id: 4, name: 'Pathmanathan Selladurai', email: 'farmer.pathma@agri.lk', password: defaultPassword, role: 'farmer', location: 'Jaffna', phone: '+94 75 444 3322' },
      { id: 5, name: 'Anura Senanayake', email: 'farmer.anura@agri.lk', password: defaultPassword, role: 'farmer', location: 'Anuradhapura', phone: '+94 70 888 9900' },
      { id: 6, name: 'Kolitha Herath', email: 'farmer.kolitha@agri.lk', password: defaultPassword, role: 'farmer', location: 'Kurunegala', phone: '+94 77 333 2211' }
    ];

    const buyers = [
      { id: 7, name: 'Lanka Fresh Supermarket', email: 'buyer.supermarket@market.lk', password: defaultPassword, role: 'buyer', location: 'Colombo', phone: '+94 11 234 5678' },
      { id: 8, name: 'Nimal Wholesale Merchants', email: 'buyer.nimal@market.lk', password: defaultPassword, role: 'buyer', location: 'Kandy', phone: '+94 81 765 4321' },
      { id: 9, name: 'Green Leaf Restaurant Chain', email: 'buyer.greenleaf@market.lk', password: defaultPassword, role: 'buyer', location: 'Galle', phone: '+94 91 456 7890' }
    ];

    const insertUser = db.prepare(`
      INSERT OR IGNORE INTO users (id, name, email, password, role, location, phone)
      VALUES (@id, @name, @email, @password, @role, @location, @phone)
    `);

    for (const u of [...farmers, ...buyers]) {
      insertUser.run(u);
    }

    const cropListings = [
      { id: 1, farmer_id: 1, crop_name: 'Fresh Nuwara Eliya Carrots', category: 'Vegetables', quantity: 500, initial_quantity: 500, unit: 'kg', price: 240, location: 'Nuwara Eliya', status: 'available', description: 'Crisp, high-altitude premium organic carrots harvested fresh from Lovers Leap farm slopes.', harvest_date: '2026-09-02', image_emoji: '🥕' },
      { id: 2, farmer_id: 1, crop_name: 'Green Beans (Chipper)', category: 'Vegetables', quantity: 350, initial_quantity: 400, unit: 'kg', price: 310, location: 'Nuwara Eliya', status: 'partially_reserved', description: 'Tender tender green beans grown with minimal pesticides in Kandapola valley.', harvest_date: '2026-09-03', image_emoji: '🫛' },
      { id: 3, farmer_id: 2, crop_name: 'Dambulla Green Chili', category: 'Spices & Chili', quantity: 200, initial_quantity: 200, unit: 'kg', price: 480, location: 'Dambulla', status: 'available', description: 'Pungent, freshly picked Sri Lankan hot green chili straight from Dambulla agricultural zone.', harvest_date: '2026-09-04', image_emoji: '🌶️' },
      { id: 4, farmer_id: 2, crop_name: 'Local Red Tomatoes', category: 'Vegetables', quantity: 600, initial_quantity: 600, unit: 'kg', price: 180, location: 'Dambulla', status: 'available', description: 'Juicy ripe tomatoes ideal for salad, curry, and sauce processing.', harvest_date: '2026-09-03', image_emoji: '🍅' },
      { id: 5, farmer_id: 3, crop_name: 'Samba Rice Paddy (Organic)', category: 'Grains & Rice', quantity: 2000, initial_quantity: 2500, unit: 'kg', price: 220, location: 'Polonnaruwa', status: 'partially_reserved', description: 'Polonnaruwa ancient tank-irrigated premium white Samba rice, unpolished high quality.', harvest_date: '2026-08-28', image_emoji: '🌾' },
      { id: 6, farmer_id: 3, crop_name: 'Yellow Pumpkin (Wattakka)', category: 'Roots & Tubers', quantity: 800, initial_quantity: 800, unit: 'kg', price: 130, location: 'Polonnaruwa', status: 'available', description: 'Sweet golden pumpkins harvested from Parakrama Samudra farm belt.', harvest_date: '2026-08-30', image_emoji: '🎃' },
      { id: 7, farmer_id: 4, crop_name: 'Jaffna Big Onions', category: 'Vegetables', quantity: 1200, initial_quantity: 1200, unit: 'kg', price: 260, location: 'Jaffna', status: 'available', description: 'Dry, firm red big onions cultivated in red limestone soils of Chunnakam.', harvest_date: '2026-08-29', image_emoji: '🧅' },
      { id: 8, farmer_id: 4, crop_name: 'Purple Brinjal (Eggplant)', category: 'Vegetables', quantity: 300, initial_quantity: 300, unit: 'kg', price: 190, location: 'Jaffna', status: 'available', description: 'Glossy purple local brinjals picked early morning.', harvest_date: '2026-09-04', image_emoji: '🍆' },
      { id: 9, farmer_id: 5, crop_name: 'Keeri Samba Rice', category: 'Grains & Rice', quantity: 0, initial_quantity: 1500, unit: 'kg', price: 330, location: 'Anuradhapura', status: 'reserved', description: 'Top-tier fragrant Keeri Samba rice batch fully reserved by Colombo wholesalers.', harvest_date: '2026-08-25', image_emoji: '🌾' },
      { id: 10, farmer_id: 5, crop_name: 'Manioc (Cassava)', category: 'Roots & Tubers', quantity: 450, initial_quantity: 450, unit: 'kg', price: 110, location: 'Anuradhapura', status: 'available', description: 'Starchy white organic cassava root freshly dug from Rajarata dry zone soil.', harvest_date: '2026-09-03', image_emoji: '🍠' },
      { id: 11, farmer_id: 6, crop_name: 'Fresh Coconuts (King & Harvest)', category: 'Coconut', quantity: 1500, initial_quantity: 1500, unit: 'items', price: 120, location: 'Kurunegala', status: 'available', description: 'Large mature coconuts from Coconut Triangle estate in Narammala.', harvest_date: '2026-09-01', image_emoji: '🥥' },
      { id: 12, farmer_id: 6, crop_name: 'Sweet Potatoes (Batala)', category: 'Roots & Tubers', quantity: 600, initial_quantity: 600, unit: 'kg', price: 160, location: 'Kurunegala', status: 'available', description: 'Naturally sweet red-skinned sweet potatoes high in fiber.', harvest_date: '2026-09-02', image_emoji: '🥔' }
    ];

    const insertListing = db.prepare(`
      INSERT OR IGNORE INTO listings (id, farmer_id, crop_name, category, quantity, initial_quantity, unit, price, location, status, description, harvest_date, image_emoji)
      VALUES (@id, @farmer_id, @crop_name, @category, @quantity, @initial_quantity, @unit, @price, @location, @status, @description, @harvest_date, @image_emoji)
    `);

    for (const l of cropListings) {
      insertListing.run(l);
    }

    const reservations = [
      { id: 1, listing_id: 2, buyer_id: 7, reserved_quantity: 50, total_price: 15500, notes: 'Please arrange morning collection at Nuwara Eliya hub.' },
      { id: 2, listing_id: 5, buyer_id: 8, reserved_quantity: 500, total_price: 110000, notes: 'Bulk purchase for wholesale distribution in Kandy market.' },
      { id: 3, listing_id: 9, buyer_id: 7, reserved_quantity: 1500, total_price: 495000, notes: 'Entire lot reserved for Colombo supermarket network.' }
    ];

    const insertReservation = db.prepare(`
      INSERT OR IGNORE INTO reservations (id, listing_id, buyer_id, reserved_quantity, total_price, notes)
      VALUES (@id, @listing_id, @buyer_id, @reserved_quantity, @total_price, @notes)
    `);

    for (const r of reservations) {
      insertReservation.run(r);
    }

    const reviews = [
      { id: 1, farmer_id: 1, buyer_id: 7, listing_id: 1, rating: 5, comment: 'Exceptional high-altitude carrots! Crisp, fresh, and delivered right on schedule to our Colombo central hub.' },
      { id: 2, farmer_id: 1, buyer_id: 8, listing_id: 2, rating: 5, comment: 'Sunil is one of the most reliable farmers in Kandapola. Outstanding green beans quality.' },
      { id: 3, farmer_id: 2, buyer_id: 7, listing_id: 3, rating: 4, comment: 'Top quality hot green chilis from Dambulla farm belt. Very fresh batch.' },
      { id: 4, farmer_id: 3, buyer_id: 8, listing_id: 5, rating: 5, comment: 'Polonnaruwa Samba rice of pristine quality. Direct farm transaction was smooth and transparent.' }
    ];

    const insertReview = db.prepare(`
      INSERT OR IGNORE INTO reviews (id, farmer_id, buyer_id, listing_id, rating, comment)
      VALUES (@id, @farmer_id, @buyer_id, @listing_id, @rating, @comment)
    `);

    for (const rev of reviews) {
      insertReview.run(rev);
    }

    const messages = [
      { id: 1, farmer_id: 1, buyer_id: 7, listing_id: 1, subject: 'Weekly Bulk Carrot Supply Inquiry', message: 'Hi Sunil! We are interested in contracting 200 kg of fresh carrots weekly for our Colombo supermarket chain. Please let us know if you have steady harvest capacity.' },
      { id: 2, farmer_id: 1, buyer_id: 8, listing_id: 2, subject: 'Green Beans Transport Details', message: 'Hello Sunil, regarding our green beans reservation, can we schedule pickup at the Kandapola collection hub tomorrow morning at 7:00 AM?' },
      { id: 3, farmer_id: 2, buyer_id: 9, listing_id: 3, subject: 'Hot Green Chili Bulk Order', message: 'Greetings Kamal! Our restaurant chain in Galle requires 50 kg of Dambulla green chilis. Please confirm availability and packing options.' }
    ];

    const insertMessage = db.prepare(`
      INSERT OR IGNORE INTO messages (id, farmer_id, buyer_id, listing_id, subject, message)
      VALUES (@id, @farmer_id, @buyer_id, @listing_id, @subject, @message)
    `);

    for (const m of messages) {
      insertMessage.run(m);
    }

    console.log('✅ Auto-seeded complete dataset successfully!');
  } catch (err) {
    console.error('❌ Error during auto-seeding:', err);
  }
}

export default db;
