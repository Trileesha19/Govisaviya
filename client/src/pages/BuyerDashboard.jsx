import React, { useState, useEffect } from 'react';
import { ShoppingBag, Sprout, MapPin, Phone, Mail, Calendar, CheckCircle2, AlertCircle, Clock, Star, MessageSquare } from 'lucide-react';
import { apiFetch } from '../services/api';

export default function BuyerDashboard({ onShowToast, onOpenReviewModal }) {
  const [activeTab, setActiveTab] = useState('reservations'); // 'reservations' or 'messages'
  const [reservations, setReservations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBuyerData = async () => {
    try {
      const [resvData, msgData] = await Promise.all([
        apiFetch('/reservations/buyer'),
        apiFetch('/messages/buyer')
      ]);
      setReservations(resvData.reservations || []);
      setMessages(msgData.messages || []);
    } catch (err) {
      console.error('Failed to load buyer data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuyerData();

    // Auto-polling every 4 seconds for real-time live updates without refreshing
    const timer = setInterval(() => {
      fetchBuyerData();
    }, 4000);

    const handleFocus = () => {
      fetchBuyerData();
    };

    const handleReviewSubmitted = () => {
      fetchBuyerData();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('govisaviya_review_submitted', handleReviewSubmitted);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('govisaviya_review_submitted', handleReviewSubmitted);
    };
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
            <h1 className="text-2xl font-extrabold text-white font-outfit">Buyer Dashboard</h1>
            <p className="text-xs text-slate-400">Track produce reservations, live order status & farmer notifications</p>
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

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-800 space-x-4">
        <button
          onClick={() => setActiveTab('reservations')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 transition-all border-b-2 ${
            activeTab === 'reservations'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>My Reservations ({reservations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('messages')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 transition-all border-b-2 ${
            activeTab === 'messages'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Farmer Updates & Notifications ({messages.length})</span>
        </button>
      </div>

      {/* Tab 1: Reservations List */}
      {activeTab === 'reservations' && (
        <div>
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
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        resv.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        resv.status === 'denied' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {resv.status === 'accepted' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Accepted by Farmer</span>
                          </>
                        ) : resv.status === 'denied' ? (
                          <>
                            <AlertCircle className="w-3 h-3" />
                            <span>Declined by Farmer</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>Pending Farmer Approval</span>
                          </>
                        )}
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
      )}

      {/* Tab 2: Notifications & Messages Inbox */}
      {activeTab === 'messages' && (
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center space-y-2">
              <MessageSquare className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="text-base font-bold text-white font-outfit">No notifications or messages received yet</h3>
              <p className="text-xs text-slate-400">Order updates and farmer responses will appear here automatically.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-slate-700 transition-all">
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          msg.subject?.includes('ACCEPTED') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          msg.subject?.includes('DECLINED') ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                          'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        }`}>
                          {msg.subject?.includes('ACCEPTED') ? '✅ Order Accepted' : msg.subject?.includes('DECLINED') ? '❌ Order Declined' : 'Message'}
                        </span>
                        <h4 className="font-bold text-white text-base">{msg.subject || 'Farmer Notification'}</h4>
                      </div>
                      {msg.crop_name && (
                        <p className="text-xs text-emerald-400 font-semibold">
                          Produce: {msg.crop_name}
                        </p>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(msg.created_at).toLocaleString()}</span>
                    </span>
                  </div>

                  {/* Farmer Contact Info */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                    <span className="flex items-center space-x-1">
                      <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                      <strong className="text-white">From Farmer: {msg.farmer_name}</strong>
                    </span>
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      <span>Region: {msg.farmer_location}</span>
                    </span>
                    {msg.farmer_phone && (
                      <span className="flex items-center space-x-1">
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{msg.farmer_phone}</span>
                      </span>
                    )}
                    <span className="flex items-center space-x-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <a href={`mailto:${msg.farmer_email}`} className="hover:underline text-cyan-300">{msg.farmer_email}</a>
                    </span>
                  </div>

                  {/* Notification Content Box */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs text-slate-200 leading-relaxed font-sans">
                    "{msg.message}"
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
