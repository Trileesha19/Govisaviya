import express from 'express';
import db from '../database.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const totalListings = db.prepare('SELECT COUNT(*) as count FROM listings').get().count;
    const totalFarmers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'farmer'").get().count;
    const totalBuyers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'buyer'").get().count;
    
    const produceStats = db.prepare(`
      SELECT 
        COALESCE(SUM(initial_quantity), 0) as total_listed_qty,
        COALESCE(SUM(initial_quantity - quantity), 0) as total_reserved_qty
      FROM listings
    `).get();

    const reservationStats = db.prepare(`
      SELECT 
        COUNT(*) as total_reservations,
        COALESCE(SUM(total_price), 0) as total_trade_value
      FROM reservations
    `).get();

    const locations = db.prepare('SELECT DISTINCT location FROM listings').all().map(r => r.location);

    res.json({
      totalListings,
      totalFarmers,
      totalBuyers,
      totalListedQuantity: produceStats.total_listed_qty,
      totalReservedQuantity: produceStats.total_reserved_qty,
      totalReservations: reservationStats.total_reservations,
      totalTradeValueLKR: reservationStats.total_trade_value,
      activeLocationsCount: locations.length,
      locations
    });
  } catch (err) {
    console.error('Fetch stats error:', err);
    res.status(500).json({ error: 'Failed to fetch platform statistics.' });
  }
});

export default router;
