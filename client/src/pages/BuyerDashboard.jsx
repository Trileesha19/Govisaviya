import '../account.css';
import React, { useState, useEffect } from 'react';
import { ShoppingBag, Sprout, MapPin, Phone, Mail, Calendar, CheckCircle2, AlertCircle, Clock, Star, MessageSquare } from 'lucide-react';
import { apiFetch } from '../services/api';

export default function BuyerDashboard({ onShowToast, onOpenReviewModal }) {
  const [activeTab, setActiveTab] = useState('reservations'); // 'reservations' or 'messages'
  const [reservations, setReservations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const fetchBuyerData = async () => {
    try {
      const [resvData, msgData] = await Promise.all([
        apiFetch('/reservations/buyer'),
        apiFetch('/messages/buyer')
      ]);
      setLoadError('');
      setReservations(resvData.reservations || []);
      setMessages(msgData.messages || []);
    } catch (err) {
      setLoadError(err.message || 'Unable to load your reservations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuyerData();

    // Refresh while visible without exhausting the shared API rate limit.
    const timer = setInterval(() => {
      if (!document.hidden) fetchBuyerData();
    }, 60000);

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

  const totalSpent = reservations.filter(r => r.status !== 'denied').reduce((acc, r) => acc + r.total_price, 0);
  const activeReservations = reservations.filter(r => r.status !== 'denied').length;

  return (
    <div className="account-page space-y-6 pb-12">
      {loadError && <div className="dashboard-error" role="alert"><span>{loadError}</span><button type="button" onClick={fetchBuyerData}>Try again</button></div>}
      
      {/* Header Banner */}
      <div className="dashboard-header flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#173f35] font-outfit">Your reservations</h1>
            <p className="text-sm text-slate-600">Follow your orders and stay connected with your farmers.</p>
          </div>
        </div>

        <div className="flex space-x-3 text-right">
          <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
            <span className="text-sm text-slate-600 font-semibold block uppercase">Active reservations</span>
            <span className="text-lg font-extrabold text-amber-800 font-outfit">{activeReservations.toLocaleString()}</span>
          </div>
          <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
            <span className="text-sm text-slate-600 font-semibold block uppercase">Reservation value</span>
            <span className="text-lg font-extrabold text-emerald-700 font-outfit">LKR {totalSpent.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="dashboard-tabs flex border-b border-slate-200 space-x-4">
        <button
          onClick={() => setActiveTab('reservations')}
          aria-pressed={activeTab === 'reservations'}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 transition-all border-b-2 ${
            activeTab === 'reservations'
              ? 'border-amber-600 text-amber-800'
              : 'border-transparent text-slate-600 hover:text-[#173f35]'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>My Reservations ({reservations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('messages')}
          aria-pressed={activeTab === 'messages'}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 transition-all border-b-2 ${
            activeTab === 'messages'
              ? 'border-cyan-600 text-cyan-700'
              : 'border-transparent text-slate-600 hover:text-[#173f35]'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Farmer Updates & Notifications ({messages.length})</span>
        </button>
      </div>

      {/* Tab 1: Reservations List */}
      {!loadError && activeTab === 'reservations' && (
        <div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-28 bg-white rounded-2xl animate-pulse-subtle" />
              ))}
            </div>
          ) : reservations.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-lg font-bold text-[#173f35] font-outfit">No active produce reservations</h3>
              <p className="text-sm text-slate-600 max-w-sm mx-auto">
                Browse the marketplace to reserve fresh produce directly from local farmers in Nuwara Eliya, Dambulla, and Polonnaruwa.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reservations.map((resv) => (
                <div key={resv.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-200 transition-all">
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-2xl">
                        {resv.image_emoji || '🌾'}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[#173f35]">{resv.crop_name}</h3>
                        <span className="text-sm font-semibold text-emerald-700">
                          Reserved: {resv.reserved_quantity} {resv.unit} @ LKR {resv.unit_price} / {resv.unit}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                      <span className="flex items-center space-x-1 text-slate-700">
                        <Sprout className="w-3.5 h-3.5 text-emerald-700" />
                        <strong>Farmer: {resv.farmer_name}</strong>
                      </span>
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-700" />
                        <span>Farm Location: {resv.produce_location}</span>
                      </span>
                      {resv.farmer_phone && (
                        <span className="flex items-center space-x-1">
                          <Phone className="w-3.5 h-3.5 text-cyan-700" />
                          <span>{resv.farmer_phone}</span>
                        </span>
                      )}
                      <span className="flex items-center space-x-1">
                        <Mail className="w-3.5 h-3.5 text-slate-600" />
                        <span>{resv.farmer_email}</span>
                      </span>
                    </div>

                    {resv.notes && (
                      <p className="text-sm text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 italic">
                        Note: "{resv.notes}"
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0 space-y-1">
                    <div className="flex flex-col items-end gap-1">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-sm font-semibold border ${
                        resv.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        resv.status === 'denied' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-amber-50 text-amber-800 border-amber-200'
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
                      <span className={`text-sm px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        resv.reservation_method === 'email'
                          ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {resv.reservation_method === 'email' ? '✉️ Direct Email' : '⚡ Via App'}
                      </span>
                    </div>
                    <div className="text-2xl font-extrabold text-[#173f35]">
                      <span className="text-emerald-700 text-sm font-semibold">LKR </span>
                      {resv.total_price.toLocaleString()}
                    </div>
                    <span className="text-sm text-slate-600 flex items-center justify-end space-x-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(resv.timestamp).toLocaleString()}</span>
                    </span>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => onOpenReviewModal && onOpenReviewModal({ farmerId: resv.farmer_id, farmerName: resv.farmer_name, listingId: resv.listing_id, cropName: resv.crop_name })}
                        className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-50 text-amber-800 border border-amber-200 text-sm font-bold flex items-center space-x-1.5 transition-all"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-800" />
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
      {!loadError && activeTab === 'messages' && (
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
              <MessageSquare className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-[#173f35] font-outfit">No notifications or messages received yet</h3>
              <p className="text-sm text-slate-600">Order updates will appear here. Farmers can reply to your inquiries by email.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 hover:border-slate-200 transition-all">
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded-full text-sm font-bold uppercase ${
                          msg.subject?.includes('ACCEPTED') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          msg.subject?.includes('DECLINED') ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-cyan-50 text-cyan-700 border border-cyan-200'
                        }`}>
                          {msg.subject?.includes('ACCEPTED') ? '✅ Order Accepted' : msg.subject?.includes('DECLINED') ? '❌ Order Declined' : 'Message'}
                        </span>
                        <h4 className="font-bold text-[#173f35] text-base">{msg.subject || 'Farmer Notification'}</h4>
                      </div>
                      {msg.crop_name && (
                        <p className="text-sm text-emerald-700 font-semibold">
                          Produce: {msg.crop_name}
                        </p>
                      )}
                    </div>

                    <span className="text-sm text-slate-600 flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(msg.created_at).toLocaleString()}</span>
                    </span>
                  </div>

                  {/* Farmer Contact Info */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-700">
                    <span className="flex items-center space-x-1">
                      <Sprout className="w-3.5 h-3.5 text-emerald-700" />
                      <strong className="text-[#173f35]">From Farmer: {msg.farmer_name}</strong>
                    </span>
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-700" />
                      <span>Region: {msg.farmer_location}</span>
                    </span>
                    {msg.farmer_phone && (
                      <span className="flex items-center space-x-1">
                        <Phone className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{msg.farmer_phone}</span>
                      </span>
                    )}
                    <span className="flex items-center space-x-1">
                      <Mail className="w-3.5 h-3.5 text-slate-600" />
                      <a href={`mailto:${msg.farmer_email}`} className="hover:underline text-cyan-700">{msg.farmer_email}</a>
                    </span>
                  </div>

                  {/* Notification Content Box */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed font-sans">
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
