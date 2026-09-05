import express from 'express';
import db from '../database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// POST reserve produce listing (Buyer only)
router.post('/', authenticateToken, requireRole('buyer'), (req, res) => {
  try {
    const { listing_id, reserved_quantity, notes, reservation_method = 'in_app' } = req.body;

    if (!listing_id || reserved_quantity === undefined) {
      return res.status(400).json({ error: 'Listing ID and reserved quantity are required.' });
    }

    const method = ['email', 'in_app'].includes(reservation_method) ? reservation_method : 'in_app';
    const qtyToReserve = Number(reserved_quantity);
    if (isNaN(qtyToReserve) || qtyToReserve <= 0) {
      return res.status(400).json({ error: 'Reserved quantity must be greater than zero.' });
    }

    // Execute within SQLite transaction to ensure atomicity
    const executeReservation = db.transaction(() => {
      const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(listing_id);

      if (!listing) {
        throw new Error('NOT_FOUND: Produce listing does not exist.');
      }

      if (listing.status === 'reserved' || listing.quantity <= 0) {
        throw new Error('OUT_OF_STOCK: This listing is already fully reserved / sold out.');
      }

      if (qtyToReserve > listing.quantity) {
        throw new Error(`INSUFFICIENT_STOCK: Requested quantity (${qtyToReserve} ${listing.unit}) exceeds available stock (${listing.quantity} ${listing.unit}).`);
      }

      const newAvailableQty = listing.quantity - qtyToReserve;
      const newStatus = newAvailableQty === 0 ? 'reserved' : 'partially_reserved';
      const totalPrice = qtyToReserve * listing.price;

      // 1. Update listing quantity and status
      db.prepare(`
        UPDATE listings
        SET quantity = ?, status = ?
        WHERE id = ?
      `).run(newAvailableQty, newStatus, listing.id);

      // 2. Insert reservation record with reservation_method and default status 'pending'
      const result = db.prepare(`
        INSERT INTO reservations (listing_id, buyer_id, reserved_quantity, total_price, reservation_method, status, notes)
        VALUES (?, ?, ?, ?, ?, 'pending', ?)
      `).run(listing.id, req.user.id, qtyToReserve, totalPrice, method, notes ? notes.trim() : null);

      // 3. Fetch detailed reservation response
      const reservation = db.prepare(`
        SELECT r.*, 
               l.crop_name, l.unit, l.price as unit_price, l.location as produce_location, l.image_emoji,
               f.name as farmer_name, f.phone as farmer_phone, f.email as farmer_email,
               b.name as buyer_name, b.email as buyer_email, b.phone as buyer_phone, b.location as buyer_location
        FROM reservations r
        JOIN listings l ON r.listing_id = l.id
        JOIN users f ON l.farmer_id = f.id
        JOIN users b ON r.buyer_id = b.id
        WHERE r.id = ?
      `).get(result.lastInsertRowid);

      // Generate mailto link parameters
      const emailSubject = `[Govisaviya LK Order] Reservation Inquiry for ${reservation.crop_name} (${reservation.reserved_quantity} ${reservation.unit})`;
      const emailBody = `Dear ${reservation.farmer_name},\n\nI would like to reserve the following produce from your farm on the Govisaviya LK Marketplace:\n\n` +
        `• Produce: ${reservation.crop_name}\n` +
        `• Quantity Reserved: ${reservation.reserved_quantity} ${reservation.unit}\n` +
        `• Unit Price: LKR ${reservation.unit_price} / ${reservation.unit}\n` +
        `• Total Value: LKR ${reservation.total_price.toLocaleString()}\n` +
        `• Farm Location: ${reservation.produce_location}\n\n` +
        `Buyer Contact Information:\n` +
        `• Buyer Name: ${reservation.buyer_name}\n` +
        `• Email: ${reservation.buyer_email}\n` +
        `• Phone: ${reservation.buyer_phone || 'Not provided'}\n` +
        `• Buyer Region: ${reservation.buyer_location}\n\n` +
        (notes ? `Additional Notes: "${notes}"\n\n` : '') +
        `Please confirm collection/delivery details.\n\nBest regards,\n${reservation.buyer_name}`;

      const mailtoUrl = `mailto:${encodeURIComponent(reservation.farmer_email)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

      return {
        reservation,
        remainingQuantity: newAvailableQty,
        updatedStatus: newStatus,
        emailDetails: {
          farmerEmail: reservation.farmer_email,
          subject: emailSubject,
          body: emailBody,
          mailtoUrl
        }
      };
    });

    const data = executeReservation();

    const channelText = method === 'email' ? 'via Email Inquiry' : 'via App';

    res.status(201).json({
      message: `Successfully reserved ${qtyToReserve} ${data.reservation.unit} of ${data.reservation.crop_name} (${channelText})! Waiting for farmer confirmation.`,
      reservation: data.reservation,
      remainingQuantity: data.remainingQuantity,
      listingStatus: data.updatedStatus,
      emailDetails: data.emailDetails
    });

  } catch (err) {
    console.error('Reservation error:', err.message);
    if (err.message.startsWith('NOT_FOUND:')) {
      return res.status(404).json({ error: err.message.replace('NOT_FOUND: ', '') });
    }
    if (err.message.startsWith('OUT_OF_STOCK:') || err.message.startsWith('INSUFFICIENT_STOCK:')) {
      return res.status(400).json({ error: err.message.replace(/^[A-Z_]+: /, '') });
    }
    res.status(500).json({ error: 'Failed to process reservation.' });
  }
});

// PUT update reservation status (Farmer only, accept or deny order)
router.put('/:id/status', authenticateToken, requireRole('farmer'), (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const targetId = Number(id);
    if (isNaN(targetId)) {
      return res.status(400).json({ error: 'Invalid reservation ID format.' });
    }

    if (!['accepted', 'denied'].includes(status)) {
      return res.status(400).json({ error: 'Status must be either "accepted" or "denied".' });
    }

    const updateReservationStatus = db.transaction(() => {
      const reservation = db.prepare(`
        SELECT r.*, 
               l.farmer_id, l.crop_name, l.unit, COALESCE(l.quantity, 0) as current_listing_qty, COALESCE(l.initial_quantity, 0) as initial_quantity,
               f.name as farmer_name,
               b.id as buyer_id, b.name as buyer_name, b.email as buyer_email
        FROM reservations r
        LEFT JOIN listings l ON r.listing_id = l.id
        LEFT JOIN users f ON l.farmer_id = f.id
        LEFT JOIN users b ON r.buyer_id = b.id
        WHERE r.id = ?
      `).get(targetId);

      if (!reservation) {
        throw new Error('NOT_FOUND: Reservation not found.');
      }

      if (Number(reservation.farmer_id) !== Number(req.user.id)) {
        throw new Error('FORBIDDEN: You can only accept or deny reservations for your own produce listings.');
      }

      if (reservation.status === status) {
        throw new Error(`ALREADY_SET: Order is already marked as ${status}.`);
      }

      const prevStatus = reservation.status;

      // 1. Update reservation status
      db.prepare('UPDATE reservations SET status = ? WHERE id = ?').run(status, targetId);

      // 2. If denied, restore stock quantity to listing
      if (status === 'denied' && prevStatus !== 'denied' && reservation.listing_id) {
        const restoredQty = reservation.current_listing_qty + reservation.reserved_quantity;
        const newListingStatus = restoredQty >= reservation.initial_quantity ? 'available' : 'partially_reserved';

        db.prepare(`
          UPDATE listings
          SET quantity = ?, status = ?
          WHERE id = ?
        `).run(restoredQty, newListingStatus, reservation.listing_id);
      }

      // 3. Insert direct system notification message for the buyer
      if (reservation.buyer_id && reservation.farmer_id) {
        const actionText = status === 'accepted' ? 'ACCEPTED ✅' : 'DECLINED ❌';
        const detailMessage = status === 'accepted'
          ? `Great news! Farmer ${reservation.farmer_name || 'Seller'} has ACCEPTED your reservation of ${reservation.reserved_quantity} ${reservation.unit || 'units'} for "${reservation.crop_name || 'produce'}". Please contact the farmer to finalize collection/delivery.`
          : `Farmer ${reservation.farmer_name || 'Seller'} has DECLINED your reservation of ${reservation.reserved_quantity} ${reservation.unit || 'units'} for "${reservation.crop_name || 'produce'}". The reserved stock quantity has been restored to the marketplace.`;

        db.prepare(`
          INSERT INTO messages (farmer_id, buyer_id, listing_id, subject, message)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          req.user.id,
          reservation.buyer_id,
          reservation.listing_id,
          `Order Update: ${actionText} for ${reservation.crop_name || 'Produce'}`,
          detailMessage
        );
      }

      const updatedReservation = db.prepare(`
        SELECT r.*, 
               l.crop_name, l.unit, l.price as unit_price, l.location as listing_location, l.image_emoji,
               b.name as buyer_name, b.email as buyer_email, b.phone as buyer_phone, b.location as buyer_location
        FROM reservations r
        LEFT JOIN listings l ON r.listing_id = l.id
        LEFT JOIN users b ON r.buyer_id = b.id
        WHERE r.id = ?
      `).get(targetId);

      return updatedReservation;
    });

    const updated = updateReservationStatus();

    const responseMsg = status === 'accepted'
      ? `Order accepted successfully! Buyer ${updated.buyer_name} has been notified.`
      : `Order declined. Stock restored to marketplace and buyer ${updated.buyer_name} notified.`;

    res.json({
      message: responseMsg,
      reservation: updated
    });

  } catch (err) {
    console.error('Update reservation status error:', err.message);
    if (err.message.startsWith('NOT_FOUND:')) {
      return res.status(404).json({ error: err.message.replace('NOT_FOUND: ', '') });
    }
    if (err.message.startsWith('FORBIDDEN:')) {
      return res.status(403).json({ error: err.message.replace('FORBIDDEN: ', '') });
    }
    if (err.message.startsWith('ALREADY_SET:')) {
      return res.status(400).json({ error: err.message.replace('ALREADY_SET: ', '') });
    }
    res.status(500).json({ error: 'Failed to update reservation status.' });
  }
});

// GET reservations for logged-in Farmer (view orders placed on their produce)
router.get('/farmer', authenticateToken, requireRole('farmer'), (req, res) => {
  try {
    const reservations = db.prepare(`
      SELECT r.*, 
             l.crop_name, l.unit, l.price as unit_price, l.location as listing_location, l.image_emoji, l.status as current_listing_status,
             b.name as buyer_name, b.email as buyer_email, b.phone as buyer_phone, b.location as buyer_location
      FROM reservations r
      JOIN listings l ON r.listing_id = l.id
      JOIN users b ON r.buyer_id = b.id
      WHERE l.farmer_id = ?
      ORDER BY r.timestamp DESC
    `).all(req.user.id);

    res.json({ reservations });
  } catch (err) {
    console.error('Farmer reservations error:', err);
    res.status(500).json({ error: 'Failed to retrieve farmer reservations.' });
  }
});

// GET reservations for logged-in Buyer (view their reservation history)
router.get('/buyer', authenticateToken, requireRole('buyer'), (req, res) => {
  try {
    const reservations = db.prepare(`
      SELECT r.*, 
             l.farmer_id, l.crop_name, l.unit, l.price as unit_price, l.location as produce_location, l.image_emoji,
             f.name as farmer_name, f.email as farmer_email, f.phone as farmer_phone, f.location as farmer_location
      FROM reservations r
      JOIN listings l ON r.listing_id = l.id
      JOIN users f ON l.farmer_id = f.id
      WHERE r.buyer_id = ?
      ORDER BY r.timestamp DESC
    `).all(req.user.id);

    res.json({ reservations });
  } catch (err) {
    console.error('Buyer reservations error:', err);
    res.status(500).json({ error: 'Failed to retrieve buyer reservations.' });
  }
});

export default router;
