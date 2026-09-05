import React, { useState, useEffect } from 'react';
import { ShoppingBag, Sprout, MapPin, Phone, Mail, Calendar, CheckCircle2, Star } from 'lucide-react';
import { apiFetch } from '../services/api';

export default function BuyerDashboard({ onShowToast, onOpenReviewModal }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBuyerReservations() {
      try {
        const data = await apiFetch('/reservations/buyer');
        setReservations(data.reservations || []);
      } catch (err) {
        console.error('Failed to load buyer reservations:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadBuyerReservations();
  }, []);

  const totalSpent = reservations.reduce((acc, r) => acc + r.total_price, 0);
  const totalKg = reservations.reduce((acc, r) => acc + r.reserved_quantity, 0);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white font-outfit">My Produce Reservations</h1>
            <p className="text-xs text-slate-400">Direct Sri Lankan farm-to-table reservations & order tracking</p>
          </div>
        </div>

        <div className="flex space-x-3 text-right">
          <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Total Produce Reserved</span>
            <span className="text-lg font-extrabold text-amber-400 font-outfit">{totalKg.toLocaleString()} units/kg</span>
          </div>
          <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Total Value</span>
            <span className="text-lg font-extrabold text-emerald-400 font-outfit">LKR {totalSpent.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Reservations List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-28 bg-slate-900/60 rounded-2xl animate-pulse-subtle" />
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <ShoppingBag className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-lg font-bold text-white font-outfit">No active produce reservations</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Browse the marketplace to reserve fresh produce directly from local farmers in Nuwara Eliya, Dambulla, and Polonnaruwa.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((resv) => (
            <div key={resv.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-700 transition-all">
              
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-2xl">
                    {resv.image_emoji || '🌾'}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{resv.crop_name}</h3>
                    <span className="text-xs font-semibold text-emerald-400">
                      Reserved: {resv.reserved_quantity} {resv.unit} @ LKR {resv.unit_price} / {resv.unit}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                  <span className="flex items-center space-x-1 text-slate-200">
                    <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                    <strong>Farmer: {resv.farmer_name}</strong>
                  </span>
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>Farm Location: {resv.produce_location}</span>
                  </span>
                  {resv.farmer_phone && (
                    <span className="flex items-center space-x-1">
                      <Phone className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{resv.farmer_phone}</span>
                    </span>
                  )}
                  <span className="flex items-center space-x-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{resv.farmer_email}</span>
                  </span>
                </div>

                {resv.notes && (
                  <p className="text-xs text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 italic">
                    Note: "{resv.notes}"
                  </p>
                )}
              </div>

              <div className="text-right shrink-0 space-y-1">
                <div className="flex flex-col items-end gap-1">
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Reservation Confirmed</span>
                  </span>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    resv.reservation_method === 'email'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {resv.reservation_method === 'email' ? '✉️ Direct Email' : '⚡ Via App'}
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-white">
                  <span className="text-emerald-400 text-sm font-semibold">LKR </span>
                  {resv.total_price.toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-400 flex items-center justify-end space-x-1 mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(resv.timestamp).toLocaleString()}</span>
                </span>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => onOpenReviewModal && onOpenReviewModal({ farmerId: resv.farmer_id, farmerName: resv.farmer_name, listingId: resv.listing_id, cropName: resv.crop_name })}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center space-x-1.5 transition-all"
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>Rate Farmer</span>
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
