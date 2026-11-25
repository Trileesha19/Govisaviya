import Modal from './Modal';
import React, { useState } from 'react';
import { X, ShoppingBag, MapPin, User, AlertCircle, Mail, Zap, ExternalLink, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../services/api';

export default function ReserveModal({ listing, onClose, onSuccess }) {
  const [reservedQuantity, setReservedQuantity] = useState(Math.min(1, listing?.quantity || 1));
  const [reservationMethod, setReservationMethod] = useState('in_app'); // 'in_app' or 'email'
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!listing) return null;

  const maxAvailable = listing.quantity;
  const totalPrice = (Number(reservedQuantity) || 0) * listing.price;
  const minQuantity = listing.unit === 'items' ? 1 : 0.01;

  const handlePercentageSelect = (percentage) => {
    const share = maxAvailable * percentage / 100;
    const qty = Math.min(maxAvailable, Math.max(minQuantity, listing.unit === 'items' ? Math.round(share) : Number(share.toFixed(2))));
    setReservedQuantity(qty);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!Number.isFinite(Number(reservedQuantity)) || Number(reservedQuantity) < minQuantity || Number(reservedQuantity) > maxAvailable) {
      setError(`Quantity must be between ${minQuantity} and ${maxAvailable} ${listing.unit}.`);
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
    <Modal title="Reserve produce" onClose={onClose} className="max-w-lg">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl">
              {listing.image_emoji || '🌾'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#173f35] font-outfit">Reserve this harvest</h2>
              <p className="text-sm text-slate-600">Your request goes directly to the farmer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 rounded-lg text-slate-600 hover:text-[#173f35] hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          
          {error && (
            <div role="alert" className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Listing Brief Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[#173f35] text-sm">{listing.crop_name}</span>
              <span className="text-emerald-700 font-bold">LKR {listing.price.toLocaleString()} / {listing.unit}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-emerald-700" />
                <span>{listing.farmer_name}</span>
              </span>
              <span className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-rose-700" />
                <span>{listing.location}</span>
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between font-semibold">
              <span className="text-slate-600">Available Stock:</span>
              <span className="text-slate-700">{listing.quantity} {listing.unit}</span>
            </div>
          </div>

          {/* Reservation Channel Toggle */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Choose how to reserve</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setReservationMethod('in_app')}
                aria-pressed={reservationMethod === 'in_app'}
                className={`p-3 rounded-xl border text-sm font-bold flex flex-col items-center space-y-1 transition-all ${
                  reservationMethod === 'in_app'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-700 shadow-md '
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-200'
                }`}
              >
                <Zap className="w-5 h-5 text-emerald-700" />
                <span>Reserve in app</span>
              </button>

              <button
                type="button"
                onClick={() => setReservationMethod('email')}
                aria-pressed={reservationMethod === 'email'}
                className={`p-3 rounded-xl border text-sm font-bold flex flex-col items-center space-y-1 transition-all ${
                  reservationMethod === 'email'
                    ? 'bg-cyan-50 border-cyan-600 text-cyan-700 shadow-md '
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-200'
                }`}
              >
                <Mail className="w-5 h-5 text-cyan-700" />
                <span>Reserve + email draft</span>
              </button>
            </div>
            <p className="text-sm text-slate-600 italic pt-0.5">
              {reservationMethod === 'in_app'
                ? 'Stock is held while the farmer reviews your reservation request.'
                : `Registers your reservation and opens a draft to ${listing.farmer_email}. Send the email from your mail app.`}
            </p>
          </div>

          {/* Reserved Quantity Selector */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-semibold text-slate-700">
              <label htmlFor="reserve-quantity">Quantity ({listing.unit})</label>
              <span className="text-emerald-700">Max: {maxAvailable} {listing.unit}</span>
            </div>

            <div className="flex space-x-2">
              <input
                type="number"
                min={minQuantity}
                step={listing.unit === 'items' ? 1 : 'any'}
                max={maxAvailable}
                id="reserve-quantity"
              value={reservedQuantity}
                onChange={(e) => setReservedQuantity(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[#173f35] text-base font-bold focus:outline-none focus:border-emerald-600"
                required
              />
            </div>

            {/* Quick Presets */}
            <div className="flex space-x-2 pt-1">
              <button
                type="button"
                onClick={() => handlePercentageSelect(25)}
                className="flex-1 py-1 rounded-lg bg-slate-100 text-sm font-medium text-slate-700 hover:bg-slate-200 hover:text-[#173f35]"
              >
                25%
              </button>
              <button
                type="button"
                onClick={() => handlePercentageSelect(50)}
                className="flex-1 py-1 rounded-lg bg-slate-100 text-sm font-medium text-slate-700 hover:bg-slate-200 hover:text-[#173f35]"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => handlePercentageSelect(100)}
                className="flex-1 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-sm font-bold text-emerald-700 hover:bg-emerald-50"
              >
                Reserve All (100%)
              </button>
            </div>
          </div>

          {/* Special Notes */}
          <div className="space-y-1.5">
            <label htmlFor="reserve-notes" className="text-sm font-semibold text-slate-700">Message / Delivery Notes to Farmer:</label>
            <textarea
              rows="2"
              maxLength={1000}
              id="reserve-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Pickup preferred tomorrow morning at Nuwara Eliya collection hub..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-[#173f35] placeholder-slate-500 focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Total Cost Display */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-emerald-50 border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-700">
              <span className="text-sm font-bold uppercase tracking-wider text-slate-700">Reservation value</span>
            </div>
            <div className="text-2xl font-extrabold text-[#173f35]">
              <span className="text-emerald-700 text-sm font-semibold">LKR </span>
              {totalPrice.toLocaleString()}
            </div>
          </div>

          <p className="text-sm text-slate-600">No payment is collected here. Arrange payment and pickup with the farmer after confirmation.</p>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className={`flex-[2] py-3 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 ${
                reservationMethod === 'email'
                  ? 'bg-[#18764b] hover:bg-[#125d3b] text-white '
                  : 'bg-[#18764b] hover:bg-[#125d3b] text-white '
              }`}
            >
              {reservationMethod === 'email' ? <Mail className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
              <span>
                {submitting
                  ? 'Processing...'
                  : reservationMethod === 'email'
                  ? 'Reserve & open email'
                  : 'Request reservation'}
              </span>
            </button>
          </div>

        </form>
    </Modal>
  );
}
