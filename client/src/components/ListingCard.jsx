import React from 'react';
import { MapPin, Calendar, User, ShoppingBag, Edit3, Trash2, CheckCircle2, AlertCircle, Clock, Mail, Star, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ListingCard({ listing, onReserve, onEdit, onDelete, onOpenAuth, reviewsSummary, onViewReviews, onOpenContactFarmer }) {
  const { user } = useAuth();
  
  const isOwner = user?.role === 'farmer' && user?.id === listing.farmer_id;
  const isAvailable = listing.quantity > 0 && listing.status !== 'reserved';

  const stockPercentage = Math.round((listing.quantity / listing.initial_quantity) * 100);

  let statusBadge = (
    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
      <CheckCircle2 className="w-3 h-3" />
      <span>Available</span>
    </span>
  );

  if (listing.status === 'partially_reserved') {
    statusBadge = (
      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
        <Clock className="w-3 h-3" />
        <span>Partially Reserved</span>
      </span>
    );
  } else if (listing.status === 'reserved' || listing.quantity <= 0) {
    statusBadge = (
      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
        <AlertCircle className="w-3 h-3" />
        <span>Sold Out / Reserved</span>
      </span>
    );
  }

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group">
      
      {/* Top Banner & Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-3xl shadow-inner group-hover:scale-105 transition-transform">
              {listing.image_emoji || '🍃'}
            </div>
            <div>
              <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                {listing.category || 'Produce'}
              </span>
              <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                {listing.crop_name}
              </h3>
            </div>
          </div>
          {statusBadge}
        </div>

        {/* Farmer & Location Info */}
        <div className="flex items-center justify-between text-xs text-slate-300 py-2 border-y border-slate-800/80 my-3">
          <div className="flex items-center space-x-1.5 font-medium">
            <User className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-200">{listing.farmer_name}</span>
            {reviewsSummary?.[listing.farmer_id] ? (
              <button
                type="button"
                onClick={() => onViewReviews && onViewReviews(listing.farmer_id, listing.farmer_name)}
                className="ml-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center space-x-1 transition-all"
                title="Click to view farmer reviews"
              >
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{reviewsSummary[listing.farmer_id].avgRating}</span>
                <span className="text-slate-400 font-normal">({reviewsSummary[listing.farmer_id].totalReviews})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onViewReviews && onViewReviews(listing.farmer_id, listing.farmer_name)}
                className="ml-1 text-[10px] text-slate-500 hover:text-amber-400 flex items-center space-x-1"
                title="No reviews yet"
              >
                <Star className="w-3 h-3 text-slate-600" />
                <span>New</span>
              </button>
            )}
          </div>
          <div className="flex items-center space-x-1 text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-semibold text-slate-300">{listing.location}</span>
          </div>
        </div>

        {/* Description */}
        {listing.description && (
          <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
            {listing.description}
          </p>
        )}

        {/* Stock Progress Bar */}
        <div className="space-y-1.5 mb-4">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-400">Available Quantity:</span>
            <span className={stockPercentage > 30 ? 'text-emerald-400' : stockPercentage > 0 ? 'text-amber-400' : 'text-rose-400'}>
              {listing.quantity} / {listing.initial_quantity} {listing.unit}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                stockPercentage > 40
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-400'
                  : stockPercentage > 0
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-400'
                  : 'bg-rose-600'
              }`}
              style={{ width: `${Math.max(stockPercentage, 0)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer: Price & Actions */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] text-slate-400 font-semibold block uppercase">Price per unit</span>
          <div className="text-lg font-extrabold text-white">
            <span className="text-emerald-400 text-sm font-semibold">LKR </span>
            {listing.price.toLocaleString()}
            <span className="text-xs text-slate-400 font-normal"> / {listing.unit}</span>
          </div>
        </div>

        {/* Action Button Conditional Logic */}
        <div>
          {isOwner ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onEdit(listing)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
                title="Edit listing"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(listing.id)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 transition-all"
                title="Delete listing"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : user?.role === 'buyer' ? (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => onOpenContactFarmer && onOpenContactFarmer(listing.farmer_id, listing.farmer_name, listing.id, listing.crop_name)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition-all flex items-center justify-center"
                title={`Send direct message to farmer (${listing.farmer_name})`}
              >
                <MessageSquare className="w-4 h-4" />
              </button>

              <a
                href={`mailto:${encodeURIComponent(listing.farmer_email)}?subject=${encodeURIComponent(`[Govisaviya LK Inquiry] ${listing.crop_name} (${listing.location})`)}&body=${encodeURIComponent(`Hi ${listing.farmer_name},\n\nI am interested in your listing "${listing.crop_name}" (${listing.quantity} ${listing.unit} available at LKR ${listing.price}/${listing.unit}).\n\nPlease let me know availability and pickup options.\n\nBest regards,\n${user.name}`)}`}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all flex items-center justify-center"
                title={`Send direct email to farmer (${listing.farmer_email})`}
              >
                <Mail className="w-4 h-4" />
              </a>

              <button
                onClick={() => onReserve(listing)}
                disabled={!isAvailable}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-md ${
                  isAvailable
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 hover:scale-[1.03] active:scale-[0.98]'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{isAvailable ? 'Reserve' : 'Sold Out'}</span>
              </button>
            </div>
          ) : !user ? (
            <button
              onClick={() => onOpenAuth('login')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-emerald-500/20 text-emerald-400 border border-slate-700 hover:border-emerald-500/40 transition-all"
            >
              Log In to Reserve
            </button>
          ) : (
            <span className="text-xs text-slate-400 italic">Farmer View</span>
          )}
        </div>
      </div>

    </div>
  );
}
