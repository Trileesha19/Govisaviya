import React, { useState } from 'react';
import { X, Star, AlertCircle, CheckCircle2, Sprout } from 'lucide-react';
import { apiFetch } from '../services/api';

export default function ReviewModal({ farmerId, farmerName, listingId, cropName, onClose, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!comment.trim()) {
      setError('Please write a brief comment sharing your feedback.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await apiFetch('/reviews', {
        method: 'POST',
        body: {
          farmer_id: farmerId,
          listing_id: listingId || null,
          rating,
          comment: comment.trim()
        }
      });

      onSuccess(data.message);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-outfit">Review Farmer</h2>
              <p className="text-xs text-slate-400">Rate produce quality & farmer service</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Farmer & Crop Brief */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold">Farmer Name:</span>
              <span className="font-bold text-white">{farmerName}</span>
            </div>
            {cropName && (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-900">
                <span className="text-slate-400 font-semibold">Produce:</span>
                <span className="font-bold text-emerald-400">{cropName}</span>
              </div>
            )}
          </div>

          {/* Interactive Star Rating */}
          <div className="space-y-1.5 text-center">
            <label className="text-xs font-semibold text-slate-300">Select Rating (1 to 5 Stars):</label>
            <div className="flex justify-center space-x-2 pt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 rounded-lg focus:outline-none transition-transform hover:scale-125"
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                        : 'text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-amber-400 font-bold pt-1">
              {rating === 5 && '⭐⭐⭐⭐⭐ Outstanding / Exceptional'}
              {rating === 4 && '⭐⭐⭐⭐ Very Good Quality'}
              {rating === 3 && '⭐⭐⭐ Good / Average'}
              {rating === 2 && '⭐⭐ Below Expectations'}
              {rating === 1 && '⭐ Poor Quality'}
            </p>
          </div>

          {/* Review Comment Textarea */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Your Review Comment *</label>
            <textarea
              rows="3"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Excellent fresh carrots harvested from Lovers Leap farm. Fast response and reliable farmer!"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          {/* Submit Action */}
          <div className="flex items-center space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-[2] py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
            >
              {submitting ? 'Publishing Review...' : 'Submit Farmer Review'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
