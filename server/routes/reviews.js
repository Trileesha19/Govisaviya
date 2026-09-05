import express from 'express';
import db from '../database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET reviews summary for all farmers (Map of farmer_id -> { avgRating, totalReviews })
router.get('/summary', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT 
        farmer_id,
        ROUND(AVG(rating), 1) as avg_rating,
        COUNT(*) as total_reviews
      FROM reviews
      GROUP BY farmer_id
    `).all();

    const summary = {};
    for (const row of rows) {
      summary[row.farmer_id] = {
        avgRating: Number(row.avg_rating),
        totalReviews: row.total_reviews
      };
    }

    res.json({ summary });
  } catch (err) {
    console.error('Fetch reviews summary error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews summary.' });
  }
});

// GET all reviews for a specific farmer
router.get('/farmer/:farmer_id', (req, res) => {
  try {
    const { farmer_id } = req.params;

    const farmer = db.prepare("SELECT id, name, location, role FROM users WHERE id = ? AND role = 'farmer'").get(farmer_id);
    if (!farmer) {
      return res.status(404).json({ error: 'Farmer not found.' });
    }

    const reviews = db.prepare(`
      SELECT r.*, b.name as buyer_name, b.location as buyer_location, l.crop_name
      FROM reviews r
      JOIN users b ON r.buyer_id = b.id
      LEFT JOIN listings l ON r.listing_id = l.id
      WHERE r.farmer_id = ?
      ORDER BY r.created_at DESC
    `).all(farmer_id);

    const stats = db.prepare(`
      SELECT 
        COALESCE(ROUND(AVG(rating), 1), 0) as avg_rating,
        COUNT(*) as total_reviews
      FROM reviews
      WHERE farmer_id = ?
    `).get(farmer_id);

    res.json({
      farmer,
      avgRating: Number(stats.avg_rating),
      totalReviews: stats.total_reviews,
      reviews
    });
  } catch (err) {
    console.error('Fetch farmer reviews error:', err);
    res.status(500).json({ error: 'Failed to fetch farmer reviews.' });
  }
});

// POST submit a review for a farmer (Buyer only)
router.post('/', authenticateToken, requireRole('buyer'), (req, res) => {
  try {
    const { farmer_id, listing_id, rating, comment } = req.body;

    const numFarmerId = Number(farmer_id);
    if (!farmer_id || isNaN(numFarmerId) || rating === undefined || !comment || !comment.trim()) {
      return res.status(400).json({ error: 'Farmer ID, rating, and review comment are required.' });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5 stars.' });
    }

    const farmer = db.prepare("SELECT id, name FROM users WHERE id = ? AND role = 'farmer'").get(numFarmerId);
    if (!farmer) {
      return res.status(404).json({ error: 'Farmer not found in system.' });
    }

    const stmt = db.prepare(`
      INSERT INTO reviews (farmer_id, buyer_id, listing_id, rating, comment)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      numFarmerId,
      req.user.id,
      listing_id ? Number(listing_id) : null,
      Math.round(numRating),
      comment.trim()
    );

    const newReview = db.prepare(`
      SELECT r.*, b.name as buyer_name, b.location as buyer_location, l.crop_name
      FROM reviews r
      JOIN users b ON r.buyer_id = b.id
      LEFT JOIN listings l ON r.listing_id = l.id
      WHERE r.id = ?
    `).get(result.lastInsertRowid);

    const stats = db.prepare(`
      SELECT 
        COALESCE(ROUND(AVG(rating), 1), 0) as avg_rating,
        COUNT(*) as total_reviews
      FROM reviews
      WHERE farmer_id = ?
    `).get(numFarmerId);

    res.status(201).json({
      message: `Review submitted for ${farmer.name}! Thank you for supporting Sri Lankan farmers.`,
      review: newReview,
      avgRating: Number(stats.avg_rating),
      totalReviews: stats.total_reviews
    });
  } catch (err) {
    console.error('Create review error:', err);
    res.status(500).json({ error: 'Failed to submit review.' });
  }
});

export default router;
