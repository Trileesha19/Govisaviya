import express from 'express';
import db from '../database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Helper to assign emoji for crop visual aid
function getCropEmoji(cropName) {
  const name = cropName.toLowerCase();
  if (name.includes('rice') || name.includes('paddy') || name.includes('samba') || name.includes('kekulu')) return '🌾';
  if (name.includes('carrot')) return '🥕';
  if (name.includes('pumpkin')) return '🎃';
  if (name.includes('tomato')) return '🍅';
  if (name.includes('cabbage')) return '🥬';
  if (name.includes('bean')) return '🫛';
  if (name.includes('brinjal') || name.includes('eggplant')) return '🍆';
  if (name.includes('onion')) return '🧅';
  if (name.includes('chili') || name.includes('chilli')) return '🌶️';
  if (name.includes('coconut')) return '🥥';
  if (name.includes('manioc') || name.includes('cassava')) return '🍠';
  if (name.includes('potato')) return '🥔';
  if (name.includes('banana') || name.includes('plantain')) return '🍌';
  if (name.includes('mango')) return '🥭';
  if (name.includes('papaya')) return '🍈';
  return '🍃';
}

// GET all listings (Public, supports query filters: crop, location, status, maxPrice, farmer_id)
router.get('/', (req, res) => {
  try {
    const { crop, location, status, farmer_id, minPrice, maxPrice } = req.query;

    let query = `
      SELECT l.*, u.name as farmer_name, u.phone as farmer_phone, u.email as farmer_email
      FROM listings l
      JOIN users u ON l.farmer_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (crop) {
      query += ` AND (LOWER(l.crop_name) LIKE ? OR LOWER(l.category) LIKE ?)`;
      params.push(`%${crop.toLowerCase().trim()}%`, `%${crop.toLowerCase().trim()}%`);
    }

    if (location) {
      query += ` AND (LOWER(l.location) LIKE ? OR LOWER(u.location) LIKE ?)`;
      params.push(`%${location.toLowerCase().trim()}%`, `%${location.toLowerCase().trim()}%`);
    }

    if (status && status !== 'all') {
      query += ` AND l.status = ?`;
      params.push(status);
    }

    if (farmer_id) {
      query += ` AND l.farmer_id = ?`;
      params.push(farmer_id);
    }

    if (minPrice) {
      query += ` AND l.price >= ?`;
      params.push(Number(minPrice));
    }

    if (maxPrice) {
      query += ` AND l.price <= ?`;
      params.push(Number(maxPrice));
    }

    query += ` ORDER BY l.created_at DESC`;

    const listings = db.prepare(query).all(...params);
    res.json({ listings });
  } catch (err) {
    console.error('Fetch listings error:', err);
    res.status(500).json({ error: 'Failed to fetch produce listings.' });
  }
});

// GET single listing details by ID
router.get('/:id', (req, res) => {
  try {
    const listing = db.prepare(`
      SELECT l.*, u.name as farmer_name, u.phone as farmer_phone, u.email as farmer_email
      FROM listings l
      JOIN users u ON l.farmer_id = u.id
      WHERE l.id = ?
    `).get(req.params.id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    res.json({ listing });
  } catch (err) {
    console.error('Fetch single listing error:', err);
    res.status(500).json({ error: 'Failed to fetch listing details.' });
  }
});

// POST create new listing (Farmer only)
router.post('/', authenticateToken, requireRole('farmer'), (req, res) => {
  try {
    const { crop_name, quantity, unit, price, location, category, description, harvest_date } = req.body;

    if (!crop_name || quantity === undefined || !unit || !price || !location) {
      return res.status(400).json({ error: 'Crop name, quantity, unit, price, and location are required.' });
    }

    const qty = Number(quantity);
    const prc = Number(price);

    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive number.' });
    }

    if (isNaN(prc) || prc <= 0) {
      return res.status(400).json({ error: 'Price must be a positive number.' });
    }

    const imageEmoji = getCropEmoji(crop_name);

    const stmt = db.prepare(`
      INSERT INTO listings (farmer_id, crop_name, category, quantity, initial_quantity, unit, price, location, status, description, harvest_date, image_emoji)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'available', ?, ?, ?)
    `);

    const result = stmt.run(
      req.user.id,
      crop_name.trim(),
      category ? category.trim() : 'Vegetables',
      qty,
      qty,
      unit.trim(),
      prc,
      location.trim(),
      description ? description.trim() : '',
      harvest_date || null,
      imageEmoji
    );

    const newListing = db.prepare(`
      SELECT l.*, u.name as farmer_name, u.phone as farmer_phone, u.email as farmer_email
      FROM listings l
      JOIN users u ON l.farmer_id = u.id
      WHERE l.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Produce listing created successfully!',
      listing: newListing
    });
  } catch (err) {
    console.error('Create listing error:', err);
    res.status(500).json({ error: 'Failed to create produce listing.' });
  }
});

// PUT update existing listing (Farmer only, must be owner)
router.put('/:id', authenticateToken, requireRole('farmer'), (req, res) => {
  try {
    const { id } = req.params;
    const { crop_name, quantity, unit, price, location, category, description, harvest_date } = req.body;

    const existing = db.prepare('SELECT * FROM listings WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    if (existing.farmer_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own listings.' });
    }

    const qty = quantity !== undefined ? Number(quantity) : existing.quantity;
    const prc = price !== undefined ? Number(price) : existing.price;

    if (isNaN(qty) || qty < 0) {
      return res.status(400).json({ error: 'Quantity must be zero or positive.' });
    }

    if (isNaN(prc) || prc <= 0) {
      return res.status(400).json({ error: 'Price must be greater than zero.' });
    }

    let newStatus = existing.status;
    if (qty === 0) {
      newStatus = 'reserved';
    } else if (qty < existing.initial_quantity) {
      newStatus = 'partially_reserved';
    } else {
      newStatus = 'available';
    }

    const updatedCrop = crop_name || existing.crop_name;
    const imageEmoji = getCropEmoji(updatedCrop);

    const stmt = db.prepare(`
      UPDATE listings
      SET crop_name = ?, category = ?, quantity = ?, unit = ?, price = ?, location = ?, status = ?, description = ?, harvest_date = ?, image_emoji = ?
      WHERE id = ?
    `);

    stmt.run(
      updatedCrop.trim(),
      category !== undefined ? category.trim() : existing.category,
      qty,
      unit !== undefined ? unit.trim() : existing.unit,
      prc,
      location !== undefined ? location.trim() : existing.location,
      newStatus,
      description !== undefined ? description.trim() : existing.description,
      harvest_date !== undefined ? harvest_date : existing.harvest_date,
      imageEmoji,
      id
    );

    const updated = db.prepare(`
      SELECT l.*, u.name as farmer_name, u.phone as farmer_phone, u.email as farmer_email
      FROM listings l
      JOIN users u ON l.farmer_id = u.id
      WHERE l.id = ?
    `).get(id);

    res.json({
      message: 'Listing updated successfully!',
      listing: updated
    });
  } catch (err) {
    console.error('Update listing error:', err);
    res.status(500).json({ error: 'Failed to update listing.' });
  }
});

// DELETE listing (Farmer only, owner)
router.delete('/:id', authenticateToken, requireRole('farmer'), (req, res) => {
  try {
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM listings WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    if (existing.farmer_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own listings.' });
    }

    db.prepare('DELETE FROM listings WHERE id = ?').run(id);

    res.json({ message: 'Produce listing deleted successfully.' });
  } catch (err) {
    console.error('Delete listing error:', err);
    res.status(500).json({ error: 'Failed to delete listing.' });
  }
});

export default router;
