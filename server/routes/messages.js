import express from 'express';
import db from '../database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// POST send a message to a farmer (Buyer only)
router.post('/', authenticateToken, requireRole('buyer'), (req, res) => {
  try {
    const { farmer_id, listing_id, subject, message } = req.body;

    if (!farmer_id || !message || !message.trim()) {
      return res.status(400).json({ error: 'Farmer ID and message text are required.' });
    }

    const farmer = db.prepare("SELECT id, name FROM users WHERE id = ? AND role = 'farmer'").get(farmer_id);
    if (!farmer) {
      return res.status(404).json({ error: 'Farmer not found.' });
    }

    const stmt = db.prepare(`
      INSERT INTO messages (farmer_id, buyer_id, listing_id, subject, message)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      farmer_id,
      req.user.id,
      listing_id || null,
      subject ? subject.trim() : 'Produce Inquiry',
      message.trim()
    );

    const newMessage = db.prepare(`
      SELECT m.*, b.name as buyer_name, b.email as buyer_email, b.phone as buyer_phone, b.location as buyer_location,
             l.crop_name, l.unit
      FROM messages m
      JOIN users b ON m.buyer_id = b.id
      LEFT JOIN listings l ON m.listing_id = l.id
      WHERE m.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
      message: `Message sent successfully to ${farmer.name}!`,
      sentMessage: newMessage
    });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

// GET messages received by logged-in Farmer
router.get('/farmer', authenticateToken, requireRole('farmer'), (req, res) => {
  try {
    const messages = db.prepare(`
      SELECT m.*, 
             b.name as buyer_name, b.email as buyer_email, b.phone as buyer_phone, b.location as buyer_location,
             l.crop_name, l.unit, l.price as unit_price
      FROM messages m
      JOIN users b ON m.buyer_id = b.id
      LEFT JOIN listings l ON m.listing_id = l.id
      WHERE m.farmer_id = ?
      ORDER BY m.created_at DESC
    `).all(req.user.id);

    res.json({ messages });
  } catch (err) {
    console.error('Farmer messages error:', err);
    res.status(500).json({ error: 'Failed to fetch received messages.' });
  }
});

// GET messages sent by logged-in Buyer
router.get('/buyer', authenticateToken, requireRole('buyer'), (req, res) => {
  try {
    const messages = db.prepare(`
      SELECT m.*, 
             f.name as farmer_name, f.email as farmer_email, f.phone as farmer_phone, f.location as farmer_location,
             l.crop_name
      FROM messages m
      JOIN users f ON m.farmer_id = f.id
      LEFT JOIN listings l ON m.listing_id = l.id
      WHERE m.buyer_id = ?
      ORDER BY m.created_at DESC
    `).all(req.user.id);

    res.json({ messages });
  } catch (err) {
    console.error('Buyer messages error:', err);
    res.status(500).json({ error: 'Failed to fetch sent messages.' });
  }
});

export default router;
