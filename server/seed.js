import bcrypt from 'bcryptjs';
import db, { initDatabase } from './database.js';

async function seed() {
  console.log('🌱 Initializing SQLite Database & Seeding Sri Lankan Agricultural Data...');
  initDatabase();

  // Clear existing tables
  db.prepare('DELETE FROM messages').run();
  db.prepare('DELETE FROM reviews').run();
  db.prepare('DELETE FROM reservations').run();
  db.prepare('DELETE FROM listings').run();
  db.prepare('DELETE FROM users').run();

  // Reset sqlite autoincrement sequence
  db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('users', 'listings', 'reservations', 'reviews', 'messages')").run();

  const defaultPassword = await bcrypt.hash('password123', 10);

  // 1. Seed Farmers
  const farmers = [
    {
      name: 'Sunil Wickramasinghe',
      email: 'farmer.sunil@agri.lk',
      password: defaultPassword,
      role: 'farmer',
      location: 'Nuwara Eliya',
      phone: '+94 77 123 4567'
    },
    {
      name: 'Kamal Silva',
      email: 'farmer.kamal@agri.lk',
      password: defaultPassword,
      role: 'farmer',
      location: 'Dambulla',
      phone: '+94 71 987 6543'
    },
    {
      name: 'Bandara Rajakaruna',
      email: 'farmer.bandara@agri.lk',
      password: defaultPassword,
      role: 'farmer',
      location: 'Polonnaruwa',
      phone: '+94 76 555 4321'
    },
    {
      name: 'Pathmanathan Selladurai',
      email: 'farmer.pathma@agri.lk',
      password: defaultPassword,
      role: 'farmer',
      location: 'Jaffna',
      phone: '+94 75 444 3322'
    },
    {
      name: 'Anura Senanayake',
      email: 'farmer.anura@agri.lk',
      password: defaultPassword,
      role: 'farmer',
      location: 'Anuradhapura',
      phone: '+94 70 888 9900'
    },
    {
      name: 'Kolitha Herath',
      email: 'farmer.kolitha@agri.lk',
      password: defaultPassword,
      role: 'farmer',
      location: 'Kurunegala',
      phone: '+94 77 333 2211'
    }
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password, role, location, phone)
    VALUES (@name, @email, @password, @role, @location, @phone)
  `);

  const farmerIds = [];
  for (const farmer of farmers) {
    const res = insertUser.run(farmer);
    farmerIds.push(res.lastInsertRowid);
  }

  // 2. Seed Buyers
  const buyers = [
    {
      name: 'Lanka Fresh Supermarket',
      email: 'buyer.supermarket@market.lk',
      password: defaultPassword,
      role: 'buyer',
      location: 'Colombo',
      phone: '+94 11 234 5678'
    },
    {
      name: 'Nimal Wholesale Merchants',
      email: 'buyer.nimal@market.lk',
      password: defaultPassword,
      role: 'buyer',
      location: 'Kandy',
      phone: '+94 81 765 4321'
    },
    {
      name: 'Green Leaf Restaurant Chain',
      email: 'buyer.greenleaf@market.lk',
      password: defaultPassword,
      role: 'buyer',
      location: 'Galle',
      phone: '+94 91 456 7890'
    }
  ];

  const buyerIds = [];
  for (const buyer of buyers) {
    const res = insertUser.run(buyer);
    buyerIds.push(res.lastInsertRowid);
  }

  // 3. Seed Crop Listings across Sri Lanka
  const cropListings = [
    {
      farmer_id: farmerIds[0], // Nuwara Eliya
      crop_name: 'Fresh Nuwara Eliya Carrots',
      category: 'Vegetables',
      quantity: 500,
      initial_quantity: 500,
      unit: 'kg',
      price: 240, // LKR / kg
      location: 'Nuwara Eliya',
      status: 'available',
      description: 'Crisp, high-altitude premium organic carrots harvested fresh from Lovers Leap farm slopes.',
      harvest_date: '2026-09-02',
      image_emoji: '🥕'
    },
    {
      farmer_id: farmerIds[0], // Nuwara Eliya
      crop_name: 'Green Beans (Chipper)',
      category: 'Vegetables',
      quantity: 350,
      initial_quantity: 400,
      unit: 'kg',
      price: 310,
      location: 'Nuwara Eliya',
      status: 'partially_reserved',
      description: 'Tender tender green beans grown with minimal pesticides in Kandapola valley.',
      harvest_date: '2026-09-03',
      image_emoji: '🫛'
    },
    {
      farmer_id: farmerIds[1], // Dambulla
      crop_name: 'Dambulla Green Chili',
      category: 'Spices & Chili',
      quantity: 200,
      initial_quantity: 200,
      unit: 'kg',
      price: 480,
      location: 'Dambulla',
      status: 'available',
      description: 'Pungent, freshly picked Sri Lankan hot green chili straight from Dambulla agricultural zone.',
      harvest_date: '2026-09-04',
      image_emoji: '🌶️'
    },
    {
      farmer_id: farmerIds[1], // Dambulla
      crop_name: 'Local Red Tomatoes',
      category: 'Vegetables',
      quantity: 600,
      initial_quantity: 600,
      unit: 'kg',
      price: 180,
      location: 'Dambulla',
      status: 'available',
      description: 'Juicy ripe tomatoes ideal for salad, curry, and sauce processing.',
      harvest_date: '2026-09-03',
      image_emoji: '🍅'
    },
    {
      farmer_id: farmerIds[2], // Polonnaruwa
      crop_name: 'Samba Rice Paddy (Organic)',
      category: 'Grains & Rice',
      quantity: 2000,
      initial_quantity: 2500,
      unit: 'kg',
      price: 220,
      location: 'Polonnaruwa',
      status: 'partially_reserved',
      description: 'Polonnaruwa ancient tank-irrigated premium white Samba rice, unpolished high quality.',
      harvest_date: '2026-08-28',
      image_emoji: '🌾'
    },
    {
      farmer_id: farmerIds[2], // Polonnaruwa
      crop_name: 'Yellow Pumpkin (Wattakka)',
      category: 'Roots & Tubers',
      quantity: 800,
      initial_quantity: 800,
      unit: 'kg',
      price: 130,
      location: 'Polonnaruwa',
      status: 'available',
      description: 'Sweet golden pumpkins harvested from Parakrama Samudra farm belt.',
      harvest_date: '2026-08-30',
      image_emoji: '🎃'
    },
    {
      farmer_id: farmerIds[3], // Jaffna
      crop_name: 'Jaffna Big Onions',
      category: 'Vegetables',
      quantity: 1200,
      initial_quantity: 1200,
      unit: 'kg',
      price: 260,
      location: 'Jaffna',
      status: 'available',
      description: 'Dry, firm red big onions cultivated in red limestone soils of Chunnakam.',
      harvest_date: '2026-08-29',
      image_emoji: '🧅'
    },
    {
      farmer_id: farmerIds[3], // Jaffna
      crop_name: 'Purple Brinjal (Eggplant)',
      category: 'Vegetables',
      quantity: 300,
      initial_quantity: 300,
      unit: 'kg',
      price: 190,
      location: 'Jaffna',
      status: 'available',
      description: 'Glossy purple local brinjals picked early morning.',
      harvest_date: '2026-09-04',
      image_emoji: '🍆'
    },
    {
      farmer_id: farmerIds[4], // Anuradhapura
      crop_name: 'Keeri Samba Rice',
      category: 'Grains & Rice',
      quantity: 0,
      initial_quantity: 1500,
      unit: 'kg',
      price: 330,
      location: 'Anuradhapura',
      status: 'reserved',
      description: 'Top-tier fragrant Keeri Samba rice batch fully reserved by Colombo wholesalers.',
      harvest_date: '2026-08-25',
      image_emoji: '🌾'
    },
    {
      farmer_id: farmerIds[4], // Anuradhapura
      crop_name: 'Manioc (Cassava)',
      category: 'Roots & Tubers',
      quantity: 450,
      initial_quantity: 450,
      unit: 'kg',
      price: 110,
      location: 'Anuradhapura',
      status: 'available',
      description: 'Starchy white organic cassava root freshly dug from Rajarata dry zone soil.',
      harvest_date: '2026-09-03',
      image_emoji: '🍠'
    },
    {
      farmer_id: farmerIds[5], // Kurunegala
      crop_name: 'Fresh Coconuts (King & Harvest)',
      category: 'Coconut',
      quantity: 1500,
      initial_quantity: 1500,
      unit: 'items',
      price: 120, // LKR per coconut
      location: 'Kurunegala',
      status: 'available',
      description: 'Large mature coconuts from Coconut Triangle estate in Narammala.',
      harvest_date: '2026-09-01',
      image_emoji: '🥥'
    },
    {
      farmer_id: farmerIds[5], // Kurunegala
      crop_name: 'Sweet Potatoes (Batala)',
      category: 'Roots & Tubers',
      quantity: 600,
      initial_quantity: 600,
      unit: 'kg',
      price: 160,
      location: 'Kurunegala',
      status: 'available',
      description: 'Naturally sweet red-skinned sweet potatoes high in fiber.',
      harvest_date: '2026-09-02',
      image_emoji: '🥔'
    }
  ];

  const insertListing = db.prepare(`
    INSERT INTO listings (farmer_id, crop_name, category, quantity, initial_quantity, unit, price, location, status, description, harvest_date, image_emoji)
    VALUES (@farmer_id, @crop_name, @category, @quantity, @initial_quantity, @unit, @price, @location, @status, @description, @harvest_date, @image_emoji)
  `);

  const listingIds = [];
  for (const listing of cropListings) {
    const res = insertListing.run(listing);
    listingIds.push(res.lastInsertRowid);
  }

  // 4. Seed Initial Reservations
  const reservations = [
    {
      listing_id: listingIds[1], // Green Beans Nuwara Eliya
      buyer_id: buyerIds[0], // Lanka Fresh Supermarket
      reserved_quantity: 50,
      total_price: 50 * 310,
      notes: 'Please arrange morning collection at Nuwara Eliya hub.'
    },
    {
      listing_id: listingIds[4], // Samba Rice Polonnaruwa
      buyer_id: buyerIds[1], // Nimal Wholesale
      reserved_quantity: 500,
      total_price: 500 * 220,
      notes: 'Bulk purchase for wholesale distribution in Kandy market.'
    },
    {
      listing_id: listingIds[8], // Keeri Samba Rice Anuradhapura (fully reserved)
      buyer_id: buyerIds[0],
      reserved_quantity: 1500,
      total_price: 1500 * 330,
      notes: 'Entire lot reserved for Colombo supermarket network.'
    }
  ];

  const insertReservation = db.prepare(`
    INSERT INTO reservations (listing_id, buyer_id, reserved_quantity, total_price, notes)
    VALUES (@listing_id, @buyer_id, @reserved_quantity, @total_price, @notes)
  `);

  for (const resv of reservations) {
    insertReservation.run(resv);
  }

  // 5. Seed Farmer Reviews
  const reviews = [
    {
      farmer_id: farmerIds[0], // Sunil (Nuwara Eliya)
      buyer_id: buyerIds[0], // Lanka Fresh
      listing_id: listingIds[0],
      rating: 5,
      comment: 'Exceptional high-altitude carrots! Crisp, fresh, and delivered right on schedule to our Colombo central hub.'
    },
    {
      farmer_id: farmerIds[0], // Sunil
      buyer_id: buyerIds[1], // Nimal Wholesale
      listing_id: listingIds[1],
      rating: 5,
      comment: 'Sunil is one of the most reliable farmers in Kandapola. Outstanding green beans quality.'
    },
    {
      farmer_id: farmerIds[1], // Kamal (Dambulla)
      buyer_id: buyerIds[0],
      listing_id: listingIds[2],
      rating: 4,
      comment: 'Top quality hot green chilis from Dambulla farm belt. Very fresh batch.'
    },
    {
      farmer_id: farmerIds[2], // Bandara (Polonnaruwa)
      buyer_id: buyerIds[1],
      listing_id: listingIds[4],
      rating: 5,
      comment: 'Polonnaruwa Samba rice of pristine quality. Direct farm transaction was smooth and transparent.'
    }
  ];

  const insertReview = db.prepare(`
    INSERT INTO reviews (farmer_id, buyer_id, listing_id, rating, comment)
    VALUES (@farmer_id, @buyer_id, @listing_id, @rating, @comment)
  `);

  for (const rev of reviews) {
    insertReview.run(rev);
  }

  // 6. Seed Buyer Messages
  const messages = [
    {
      farmer_id: farmerIds[0], // Sunil (Nuwara Eliya)
      buyer_id: buyerIds[0], // Lanka Fresh Supermarket
      listing_id: listingIds[0], // Carrots
      subject: 'Weekly Bulk Carrot Supply Inquiry',
      message: 'Hi Sunil! We are interested in contracting 200 kg of fresh carrots weekly for our Colombo supermarket chain. Please let us know if you have steady harvest capacity.'
    },
    {
      farmer_id: farmerIds[0], // Sunil
      buyer_id: buyerIds[1], // Nimal Wholesale
      listing_id: listingIds[1], // Green Beans
      subject: 'Green Beans Transport Details',
      message: 'Hello Sunil, regarding our green beans reservation, can we schedule pickup at the Kandapola collection hub tomorrow morning at 7:00 AM?'
    },
    {
      farmer_id: farmerIds[1], // Kamal (Dambulla)
      buyer_id: buyerIds[2], // Green Leaf Restaurant
      listing_id: listingIds[2], // Green Chili
      subject: 'Hot Green Chili Bulk Order',
      message: 'Greetings Kamal! Our restaurant chain in Galle requires 50 kg of Dambulla green chilis. Please confirm availability and packing options.'
    }
  ];

  const insertMessage = db.prepare(`
    INSERT INTO messages (farmer_id, buyer_id, listing_id, subject, message)
    VALUES (@farmer_id, @buyer_id, @listing_id, @subject, @message)
  `);

  for (const msg of messages) {
    insertMessage.run(msg);
  }

  console.log('✅ Seeding complete!');
  console.log(`- Seeded ${farmers.length} Farmers & ${buyers.length} Buyers.`);
  console.log(`- Seeded ${cropListings.length} Realistic Sri Lankan Crop Listings.`);
  console.log(`- Seeded ${reservations.length} Sample Reservations.`);
  console.log(`- Seeded ${reviews.length} Sample Farmer Reviews.`);
  console.log(`- Seeded ${messages.length} Sample Buyer Messages.`);
  console.log('\n--- Pre-seeded Credentials ---');
  console.log('Farmer: farmer.sunil@agri.lk / password123 (Nuwara Eliya)');
  console.log('Farmer: farmer.kamal@agri.lk / password123 (Dambulla)');
  console.log('Farmer: farmer.bandara@agri.lk / password123 (Polonnaruwa)');
  console.log('Buyer:  buyer.supermarket@market.lk / password123 (Colombo)');
  console.log('Buyer:  buyer.nimal@market.lk / password123 (Kandy)');
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
