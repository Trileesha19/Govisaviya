import React, { useState } from 'react';
import { X, ShoppingBag, MapPin, User, AlertCircle, Mail, Zap, ExternalLink, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../services/api';

export default function ReserveModal({ listing, onClose, onSuccess }) {
  const [reservedQuantity, setReservedQuantity] = useState(1);
  const [reservationMethod, setReservationMethod] = useState('in_app'); // 'in_app' or 'email'
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!listing) return null;

  const maxAvailable = listing.quantity;
  const totalPrice = reservedQuantity * listing.price;

  const handlePercentageSelect = (percentage) => {
    const qty = Math.max(1, Math.round((maxAvailable * percentage) / 100));
    setReservedQuantity(qty);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (reservedQuantity <= 0 || reservedQuantity > maxAvailable) {
      setError(`Quantity must be between 1 and ${maxAvailable} ${listing.unit}.`);
      return;
    }

    setSubmitting(true);
    try {
      const result = await apiFetch('/reservations', {
        method: 'POST',
        body: {
          listing_id: listing.id,
          reserved_quantity: Number(reservedQuantity),
          reservation_method: reservationMethod,
          notes
        }
      });

      // If email channel selected, launch mailto client
      if (reservationMethod === 'email' && result.emailDetails?.mailtoUrl) {
        window.location.href = result.emailDetails.mailtoUrl;
      }

      onSuccess(result.message);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to complete reservation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl">
              {listing.image_emoji || '🌾'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-outfit">Reserve Produce Stock</h2>
              <p className="text-xs text-slate-400">UN SDG 2 Direct Farmer Connection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Listing Brief Card */}
          <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white text-sm">{listing.crop_name}</span>
              <span className="text-emerald-400 font-bold">LKR {listing.price.toLocaleString()} / {listing.unit}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>{listing.farmer_name}</span>
              </span>
              <span className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>{listing.location}</span>
              </span>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex justify-between font-semibold">
              <span className="text-slate-400">Available Stock:</span>
              <span className="text-slate-200">{listing.quantity} {listing.unit}</span>
            </div>
          </div>

          {/* Reservation Channel Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Choose How to Reserve / Connect:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setReservationMethod('in_app')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center space-y-1 transition-all ${
                  reservationMethod === 'in_app'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Zap className="w-5 h-5 text-emerald-400" />
                <span>Reserve Via App (Instant)</span>
              </button>

              <button
                type="button"
                onClick={() => setReservationMethod('email')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center space-y-1 transition-all ${
                  reservationMethod === 'email'
                    ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Mail className="w-5 h-5 text-cyan-400" />
                <span>Direct Email Inquiry</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 italic pt-0.5">
              {reservationMethod === 'in_app'
                ? '⚡ Instantly locks stock on the platform and updates farmer dashboard.'
                : `✉️ Opens pre-filled email draft to farmer (${listing.farmer_email}) and registers order.`}
            </p>
          </div>

          {/* Reserved Quantity Selector */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
              <label>Select Quantity ({listing.unit}):</label>
              <span className="text-emerald-400">Max: {maxAvailable} {listing.unit}</span>
            </div>

            <div className="flex space-x-2">
              <input
                type="number"
                min="1"
                max={maxAvailable}
                value={reservedQuantity}
                onChange={(e) => setReservedQuantity(Math.min(maxAvailable, Math.max(1, Number(e.target.value))))}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-base font-bold focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            {/* Quick Presets */}
            <div className="flex space-x-2 pt-1">
              <button
                type="button"
                onClick={() => handlePercentageSelect(25)}
                className="flex-1 py-1 rounded-lg bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                25%
              </button>
              <button
                type="button"
                onClick={() => handlePercentageSelect(50)}
                className="flex-1 py-1 rounded-lg bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => handlePercentageSelect(100)}
                className="flex-1 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30"
              >
                Reserve All (100%)
              </button>
            </div>
          </div>

          {/* Special Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Message / Delivery Notes to Farmer:</label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Pickup preferred tomorrow morning at Nuwara Eliya collection hub..."
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Total Cost Display */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 to-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-400">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Total Price:</span>
            </div>
            <div className="text-2xl font-extrabold text-white">
              <span className="text-emerald-400 text-sm font-semibold">LKR </span>
              {totalPrice.toLocaleString()}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className={`flex-[2] py-3 rounded-xl text-xs font-bold shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 ${
                reservationMethod === 'email'
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
              }`}
            >
              {reservationMethod === 'email' ? <Mail className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
              <span>
                {submitting
                  ? 'Processing...'
                  : reservationMethod === 'email'
                  ? 'Send Email & Reserve'
                  : 'Confirm In-App Reservation'}
              </span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
