import Modal from './Modal';
import React, { useState, useEffect } from 'react';
import { X, Star, User, MapPin, Calendar, MessageSquare, Sprout } from 'lucide-react';
import { apiFetch } from '../services/api';

export default function FarmerReviewsModal({ farmerId, farmerName, onClose, onOpenWriteReview }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    async function fetchFarmerReviews() {
      try {
        const res = await apiFetch(`/reviews/farmer/${farmerId}`);
        if (active) setData(res);
      } catch (err) {
        if (active) setError(err.message || 'Unable to load reviews. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchFarmerReviews();
    return () => { active = false; };
  }, [farmerId, retryCount]);

  return (
    <Modal title="Farmer reviews" onClose={onClose} className="max-w-lg">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#173f35] font-outfit">
                {farmerName || 'Farmer'} Reviews & Ratings
              </h2>
              <p className="text-sm text-slate-600">Experiences shared by local buyers</p>
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

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          
          {loading ? (
            <div className="py-8 text-center text-slate-600 text-sm animate-pulse-subtle">
              Loading farmer reviews...
            </div>
          ) : error ? (
            <div role="alert" className="space-y-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <p>{error}</p>
              <button type="button" onClick={() => setRetryCount(count => count + 1)} className="font-semibold underline">Try again</button>
            </div>
          ) : !data || data.reviews.length === 0 ? (
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 text-center space-y-3">
              <MessageSquare className="w-10 h-10 text-slate-500 mx-auto" />
              <h4 className="font-bold text-[#173f35] text-sm">No reviews yet for {farmerName}</h4>
              <p className="text-sm text-slate-600 max-w-xs mx-auto">
                Be the first buyer to review this farmer after reserving produce!
              </p>
              {onOpenWriteReview && (
                <button
                  onClick={() => onOpenWriteReview(farmerId, farmerName)}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-[#18764b] text-white hover:bg-[#125d3b] transition-all"
                >
                  Write First Review
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Overall Rating Summary Header */}
              <div className="bg-gradient-to-r from-slate-50 to-amber-50 p-4 rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-sm text-slate-600 uppercase font-semibold block">Community Rating</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-3xl font-extrabold text-amber-800 font-outfit">
                      {data.avgRating}
                    </span>
                    <div className="flex items-center text-amber-800">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${star <= Math.round(data.avgRating) ? 'fill-amber-400 text-amber-800' : 'text-slate-400'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right text-sm text-slate-600">
                  <span className="font-bold text-[#173f35] block text-sm">{data.totalReviews} buyer reviews</span>
                  <span>Buyer feedback</span>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-3">
                {data.reviews.map((rev) => (
                  <div key={rev.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 text-sm font-bold">
                          {rev.buyer_name ? rev.buyer_name.charAt(0) : 'B'}
                        </div>
                        <div>
                          <span className="font-bold text-[#173f35] text-sm block">{rev.buyer_name}</span>
                          <span className="text-sm text-slate-600">{rev.buyer_location}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 text-amber-800 text-sm">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${star <= rev.rating ? 'fill-amber-400 text-amber-800' : 'text-slate-400'}`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-sm text-slate-700 leading-relaxed italic pt-1">
                      "{rev.comment}"
                    </p>

                    <div className="flex justify-between items-center text-sm text-slate-600 pt-1 border-t border-slate-200">
                      {rev.crop_name ? <span>Produce: {rev.crop_name}</span> : <span />}
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(rev.created_at).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
          <span className="text-sm text-slate-600">From our farming community</span>
          {onOpenWriteReview && (
            <button
              onClick={() => onOpenWriteReview(farmerId, farmerName)}
              className="px-3.5 py-2 rounded-xl text-sm font-bold bg-[#18764b] text-white hover:bg-[#125d3b] transition-all"
            >
              + Rate Farmer
            </button>
          )}
        </div>
    </Modal>
  );
}
