import '../account.css';
import React, { useState, useEffect } from 'react';
import { Sprout, ShoppingBag, PlusCircle, Edit3, Trash2, MapPin, Phone, Mail, Calendar, Clock, CheckCircle2, AlertCircle, MessageSquare, User, X } from 'lucide-react';
import { apiFetch } from '../services/api';
import ListingFormModal from '../components/ListingFormModal';

export default function FarmerDashboard({ onShowToast }) {
  const [activeTab, setActiveTab] = useState('listings'); // 'listings', 'reservations', or 'messages'
  const [myListings, setMyListings] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // Modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingListing, setEditingListing] = useState(null);

  const fetchData = async () => {
    try {
      const [listingsRes, resvRes, msgRes] = await Promise.all([
        apiFetch('/listings'),
        apiFetch('/reservations/farmer'),
        apiFetch('/messages/farmer')
      ]);

      const userRes = await apiFetch('/auth/me');
      const userId = userRes.user.id;

      setMyListings((listingsRes.listings || []).filter(listing => listing.farmer_id === userId));
      setLoadError('');
      setReservations(resvRes.reservations || []);
      // Filter out system order updates so farmer only sees direct buyer inquiries
      const buyerInquiries = (msgRes.messages || []).filter(m => !m.subject?.startsWith('Order Update:'));
      setMessages(buyerInquiries);
    } catch (err) {
      setLoadError(err.message || 'Unable to load your dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Refresh while visible without exhausting the shared API rate limit.
    const timer = setInterval(() => {
      if (!document.hidden) fetchData();
    }, 60000);

    const handleFocus = () => {
      fetchData();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this produce listing?')) return;
    try {
      await apiFetch(`/listings/${listingId}`, { method: 'DELETE' });
      onShowToast('Produce listing deleted successfully.');
      fetchData();
    } catch (err) {
      onShowToast(err.message || 'Unable to delete this listing.', 'error');
    }
  };

  const handleReservationStatus = async (reservationId, status) => {
    if (updatingId !== null) return;
    setUpdatingId(reservationId);
    try {
      const res = await apiFetch(`/reservations/${reservationId}/status`, {
        method: 'PUT',
        body: { status }
      });
      onShowToast(res.message);
      fetchData();
    } catch (err) {
      onShowToast(err.message || 'Failed to update reservation status.', 'error');
      fetchData();
    } finally {
      setUpdatingId(null);
    }
  };

  const totalEarnings = reservations.filter(r => r.status !== 'denied').reduce((acc, r) => acc + r.total_price, 0);

  return (
    <div className="account-page space-y-6 pb-12">
      {loadError && <div className="dashboard-error" role="alert"><span>{loadError}</span><button type="button" onClick={fetchData}>Try again</button></div>}
      {loading && <p className="dashboard-loading" role="status">Loading your farm dashboard…</p>}
      
      {/* Header Banner */}
      <div className="dashboard-header flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#173f35] font-outfit">Your farm dashboard</h1>
            <p className="text-sm text-slate-600">Manage your farm listings & view direct buyer reservations</p>
          </div>
        </div>

        <button
          onClick={() => { setEditingListing(null); setShowFormModal(true); }}
          className="px-4 py-2.5 rounded-xl text-sm font-bold bg-[#18764b] hover:bg-[#125d3b] text-white shadow-lg  transition-all flex items-center justify-center space-x-2 shrink-0 hover:scale-[1.02]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add a harvest</span>
        </button>
      </div>

      {/* Stats Quick Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-sm text-slate-600 font-semibold block uppercase">Your produce listings</span>
          <div className="text-2xl font-extrabold text-[#173f35] font-outfit mt-1">{myListings.length}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-sm text-slate-600 font-semibold block uppercase">Reservations Received</span>
          <div className="text-2xl font-extrabold text-amber-800 font-outfit mt-1">{reservations.length} orders</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-sm text-slate-600 font-semibold block uppercase">Received Messages</span>
          <div className="text-2xl font-extrabold text-cyan-700 font-outfit mt-1">{messages.length} inquiries</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-sm text-slate-600 font-semibold block uppercase">Active reservation value</span>
          <div className="text-2xl font-extrabold text-emerald-700 font-outfit mt-1">LKR {totalEarnings.toLocaleString()}</div>
        </div>
      </div>

      {/* Dashboard Sub-Tabs */}
      <div className="dashboard-tabs flex border-b border-slate-200 space-x-4">
        <button
          onClick={() => setActiveTab('listings')}
          aria-pressed={activeTab === 'listings'}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 transition-all border-b-2 ${
            activeTab === 'listings'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-600 hover:text-[#173f35]'
          }`}
        >
          <Sprout className="w-4 h-4" />
          <span>My listings ({myListings.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('reservations')}
          aria-pressed={activeTab === 'reservations'}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 transition-all border-b-2 ${
            activeTab === 'reservations'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-600 hover:text-[#173f35]'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Reservations ({reservations.length})</span>
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
          <span>Messages ({messages.length})</span>
        </button>
      </div>

      {/* Tab 1: My Listings */}
      {!loading && !loadError && activeTab === 'listings' && (
        <div>
          {myListings.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
              <Sprout className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-[#173f35] font-outfit">No produce listings published yet</h3>
              <p className="text-sm text-slate-600">Click below to publish your fresh crop harvest to buyers nationwide.</p>
              <button
                onClick={() => { setEditingListing(null); setShowFormModal(true); }}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-[#18764b] text-white"
              >
                Add Your First Listing
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myListings.map((listing) => (
                <div key={listing.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 relative">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-2xl">{listing.image_emoji || '🌾'}</span>
                      <div>
                        <h4 className="font-bold text-[#173f35] text-base">{listing.crop_name}</h4>
                        <span className="text-sm text-slate-600">{listing.location}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-sm font-bold uppercase ${
                      listing.status === 'available' ? 'bg-emerald-50 text-emerald-700' :
                      listing.status === 'partially_reserved' ? 'bg-amber-50 text-amber-800' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {listing.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Remaining Quantity:</span>
                      <span className="font-bold text-[#173f35]">{listing.quantity} / {listing.initial_quantity} {listing.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Price per unit:</span>
                      <span className="font-bold text-emerald-700">LKR {listing.price.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
                    <button
                      onClick={() => { setEditingListing(listing); setShowFormModal(true); }}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm text-slate-700 flex items-center space-x-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteListing(listing.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-sm text-rose-700 hover:border-rose-200 flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Reservations Received */}
      {!loading && !loadError && activeTab === 'reservations' && (
        <div className="space-y-4">
          {reservations.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
              <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-[#173f35] font-outfit">No reservations received yet</h3>
              <p className="text-sm text-slate-600">When buyers reserve your produce, order details & buyer contact info will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reservations.map((resv) => (
                <div key={resv.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{resv.image_emoji || '🌾'}</span>
                      <h4 className="font-bold text-[#173f35] text-base">{resv.crop_name}</h4>
                      <span className="text-sm px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold">
                        Reserved: {resv.reserved_quantity} {resv.unit}
                      </span>
                      <span className={`text-sm px-2 py-0.5 rounded-full font-bold uppercase ${
                        resv.reservation_method === 'email'
                          ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {resv.reservation_method === 'email' ? '✉️ Email Inquiry' : '⚡ Via App'}
                      </span>
                      <span className={`text-sm px-2 py-0.5 rounded-full font-bold uppercase border ${
                        resv.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        resv.status === 'denied' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {resv.status === 'accepted' ? '✅ Accepted' : resv.status === 'denied' ? '❌ Declined' : '⏳ Pending Confirmation'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                      <span className="flex items-center space-x-1 text-slate-700">
                        <ShoppingBag className="w-3.5 h-3.5 text-amber-800" />
                        <strong className="text-[#173f35]">Buyer: {resv.buyer_name}</strong>
                      </span>
                      {resv.buyer_phone && (
                        <span className="flex items-center space-x-1">
                          <Phone className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{resv.buyer_phone}</span>
                        </span>
                      )}
                      <span className="flex items-center space-x-1">
                        <Mail className="w-3.5 h-3.5 text-slate-600" />
                        <span>{resv.buyer_email}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-700" />
                        <span>Buyer Region: {resv.buyer_location}</span>
                      </span>
                    </div>
                    {resv.notes && (
                      <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 mt-1 italic">
                        "{resv.notes}"
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0 space-y-2">
                    <div>
                      <span className="text-sm text-slate-600 block font-semibold uppercase">Active reservation value</span>
                      <div className="text-xl font-extrabold text-emerald-700">
                        LKR {resv.total_price.toLocaleString()}
                      </div>
                      <span className="text-sm text-slate-600 flex items-center justify-end space-x-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(resv.timestamp).toLocaleString()}</span>
                      </span>
                    </div>

                    {/* Accept / Decline Actions */}
                    <div className="flex items-center justify-end space-x-2 pt-1">
                      {(!resv.status || resv.status === 'pending') ? (
                        <>
                          <button
                            onClick={() => handleReservationStatus(resv.id, 'accepted')}
                            disabled={updatingId !== null}
                            className="px-3 py-1.5 rounded-lg bg-[#18764b] hover:bg-[#125d3b] text-white font-bold text-sm flex items-center space-x-1 shadow-md  transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Accept Order</span>
                          </button>
                          <button
                            onClick={() => handleReservationStatus(resv.id, 'denied')}
                            disabled={updatingId !== null}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-rose-700 hover:border-rose-200 text-sm font-bold flex items-center space-x-1 transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Decline Order</span>
                          </button>
                        </>
                      ) : null}
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Buyer Messages & Inquiries */}
      {!loading && !loadError && activeTab === 'messages' && (
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
              <MessageSquare className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-[#173f35] font-outfit">No buyer messages received yet</h3>
              <p className="text-sm text-slate-600">When buyers send direct messages or bulk inquiries regarding your produce, they will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 hover:border-slate-200 transition-all">
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded-full text-sm font-bold uppercase bg-cyan-50 text-cyan-700 border border-cyan-200">
                          Direct Inquiry
                        </span>
                        <h4 className="font-bold text-[#173f35] text-base">{msg.subject || 'Produce Inquiry'}</h4>
                      </div>
                      {msg.crop_name && (
                        <p className="text-sm text-emerald-700 font-semibold">
                          Reference Produce: {msg.crop_name}
                        </p>
                      )}
                    </div>

                    <span className="text-sm text-slate-600 flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(msg.created_at).toLocaleString()}</span>
                    </span>
                  </div>

                  {/* Buyer Contact Header */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-700">
                    <span className="flex items-center space-x-1">
                      <User className="w-3.5 h-3.5 text-cyan-700" />
                      <strong className="text-[#173f35]">From: {msg.buyer_name}</strong>
                    </span>
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-700" />
                      <span>Region: {msg.buyer_location}</span>
                    </span>
                    {msg.buyer_phone && (
                      <span className="flex items-center space-x-1">
                        <Phone className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{msg.buyer_phone}</span>
                      </span>
                    )}
                    <span className="flex items-center space-x-1">
                      <Mail className="w-3.5 h-3.5 text-slate-600" />
                      <a href={`mailto:${msg.buyer_email}`} className="hover:underline text-cyan-700">{msg.buyer_email}</a>
                    </span>
                  </div>

                  {/* Message Content Box */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed font-sans">
                    "{msg.message}"
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end pt-1">
                    <a
                      href={`mailto:${encodeURIComponent(msg.buyer_email)}?subject=${encodeURIComponent(`Re: ${msg.subject || 'Produce Inquiry'}`)}&body=${encodeURIComponent(`Hi ${msg.buyer_name},\n\nThank you for reaching out regarding my farm produce on Govisaviya LK.\n\n`)}`}
                      className="px-3.5 py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-50 text-cyan-700 border border-cyan-200 text-sm font-bold flex items-center space-x-1.5 transition-all"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Reply via Email</span>
                    </a>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Listing Modal Form */}
      {showFormModal && (
        <ListingFormModal
          listingToEdit={editingListing}
          onClose={() => { setShowFormModal(false); setEditingListing(null); }}
          onSuccess={(msg) => {
            onShowToast(msg);
            fetchData();
          }}
        />
      )}

    </div>
  );
}
