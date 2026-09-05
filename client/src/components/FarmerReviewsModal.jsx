import React, { useState, useEffect } from 'react';
import { X, Star, User, MapPin, Calendar, MessageSquare, Sprout } from 'lucide-react';
import { apiFetch } from '../services/api';

export default function FarmerReviewsModal({ farmerId, farmerName, onClose, onOpenWriteReview }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFarmerReviews() {
      try {
        const res = await apiFetch(`/reviews/farmer/${farmerId}`);
        setData(res);
      } catch (err) {
        console.error('Failed to load farmer reviews:', err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchFarmerReviews();
  }, [farmerId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-outfit">
                {farmerName || 'Farmer'} Reviews & Ratings
              </h2>
              <p className="text-xs text-slate-400">Direct Buyer Feedback & Trust Metrics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          
          {loading ? (
            <div className="py-8 text-center text-slate-400 text-xs animate-pulse-subtle">
              Loading farmer reviews...
            </div>
          ) : !data || data.reviews.length === 0 ? (
            <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 text-center space-y-3">
              <MessageSquare className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="font-bold text-white text-sm">No reviews yet for {farmerName}</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Be the first buyer to review this farmer after reserving produce!
              </p>
              {onOpenWriteReview && (
                <button
                  onClick={() => onOpenWriteReview(farmerId, farmerName)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all"
                >
                  Write First Review
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Overall Rating Summary Header */}
              <div className="bg-gradient-to-r from-slate-950 to-amber-950/20 p-4 rounded-xl border border-amber-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Community Rating</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-3xl font-extrabold text-amber-300 font-outfit">
                      {data.avgRating}
                    </span>
                    <div className="flex items-center text-amber-400">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${star <= Math.round(data.avgRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <span className="font-bold text-white block text-sm">{data.totalReviews} buyer reviews</span>
                  <span>Verified Purchases</span>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-3">
                {data.reviews.map((rev) => (
                  <div key={rev.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 text-xs font-bold">
                          {rev.buyer_name ? rev.buyer_name.charAt(0) : 'B'}
                        </div>
                        <div>
                          <span className="font-bold text-white text-xs block">{rev.buyer_name}</span>
                          <span className="text-[10px] text-slate-400">{rev.buyer_location}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 text-amber-400 text-xs">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${star <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed italic pt-1">
                      "{rev.comment}"
                    </p>

                    <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-900">
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
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-between items-center shrink-0">
          <span className="text-xs text-slate-400">UN SDG 2 Zero Hunger Trust Network</span>
          {onOpenWriteReview && (
            <button
              onClick={() => onOpenWriteReview(farmerId, farmerName)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all"
            >
              + Rate Farmer
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
