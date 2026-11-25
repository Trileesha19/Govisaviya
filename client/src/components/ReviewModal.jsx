import Modal from './Modal';
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
    <Modal title="Review farmer" onClose={onClose} className="max-w-lg">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#173f35] font-outfit">Review Farmer</h2>
              <p className="text-sm text-slate-600">Rate produce quality & farmer service</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-slate-600 hover:text-[#173f35] hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Farmer & Crop Brief */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 font-semibold">Farmer Name:</span>
              <span className="font-bold text-[#173f35]">{farmerName}</span>
            </div>
            {cropName && (
              <div className="flex items-center justify-between text-sm pt-1 border-t border-slate-200">
                <span className="text-slate-600 font-semibold">Produce:</span>
                <span className="font-bold text-emerald-700">{cropName}</span>
              </div>
            )}
          </div>

          {/* Interactive Star Rating */}
          <div className="space-y-1.5 text-center">
            <label className="text-sm font-semibold text-slate-700">Select Rating (1 to 5 Stars):</label>
            <div className="flex justify-center space-x-2 pt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  aria-label={`${star} ${star === 1 ? 'star' : 'stars'}`}
                  aria-pressed={rating === star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 rounded-lg focus:outline-none transition-transform hover:scale-125"
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'text-amber-800 fill-amber-400 '
                        : 'text-slate-500'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-amber-800 font-bold pt-1">
              {rating === 5 && '⭐⭐⭐⭐⭐ Outstanding / Exceptional'}
              {rating === 4 && '⭐⭐⭐⭐ Very Good Quality'}
              {rating === 3 && '⭐⭐⭐ Good / Average'}
              {rating === 2 && '⭐⭐ Below Expectations'}
              {rating === 1 && '⭐ Poor Quality'}
            </p>
          </div>

          {/* Review Comment Textarea */}
          <div className="space-y-1">
            <label htmlFor="review-comment" className="text-sm font-semibold text-slate-700">Your Review Comment *</label>
            <textarea
              rows="3"
              maxLength={1500}
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Excellent fresh carrots harvested from Lovers Leap farm. Fast response and reliable farmer!"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-[#173f35] placeholder-slate-500 focus:outline-none focus:border-amber-600"
              required
            />
          </div>

          {/* Submit Action */}
          <div className="flex items-center space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-[2] py-2.5 rounded-xl text-sm font-bold bg-[#18764b] hover:bg-[#125d3b] text-white shadow-lg  transition-all disabled:opacity-50"
            >
              {submitting ? 'Publishing Review...' : 'Submit Farmer Review'}
            </button>
          </div>

        </form>
    </Modal>
  );
}
