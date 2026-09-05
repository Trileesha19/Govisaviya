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

  // Modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingListing, setEditingListing] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [listingsRes, resvRes, msgRes] = await Promise.all([
        apiFetch('/listings'),
        apiFetch('/reservations/farmer'),
        apiFetch('/messages/farmer')
      ]);

      const userRes = await apiFetch('/auth/me');
      const userId = userRes.user.id;

      setMyListings(listingsRes.listings.filter(l => l.farmer_id === userId));
      setReservations(resvRes.reservations || []);
      setMessages(msgRes.messages || []);
    } catch (err) {
      console.error('Failed to load farmer dashboard:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this produce listing?')) return;
    try {
      await apiFetch(`/listings/${listingId}`, { method: 'DELETE' });
      onShowToast('Produce listing deleted successfully.');
      fetchData();
    } catch (err) {
      onShowToast(err.message || 'Failed to delete listing.', 'error');
    }
  };

  const handleReservationStatus = async (reservationId, status) => {
    try {
      const res = await apiFetch(`/reservations/${reservationId}/status`, {
        method: 'PUT',
        body: { status }
      });
      onShowToast(res.message);
      fetchData();
    } catch (err) {
      onShowToast(err.message || 'Failed to update reservation status.', 'error');
    }
  };

  const totalEarnings = reservations.reduce((acc, r) => acc + r.total_price, 0);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white font-outfit">Farmer Produce Portal</h1>
            <p className="text-xs text-slate-400">Manage your farm listings & view direct buyer reservations</p>
          </div>
        </div>

        <button
          onClick={() => { setEditingListing(null); setShowFormModal(true); }}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 shrink-0 hover:scale-[1.02]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Harvest Listing</span>
        </button>
      </div>

      {/* Stats Quick Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-semibold block uppercase">Active Produce Listings</span>
          <div className="text-2xl font-extrabold text-white font-outfit mt-1">{myListings.length}</div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-semibold block uppercase">Reservations Received</span>
          <div className="text-2xl font-extrabold text-amber-400 font-outfit mt-1">{reservations.length} orders</div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-semibold block uppercase">Received Messages</span>
          <div className="text-2xl font-extrabold text-cyan-400 font-outfit mt-1">{messages.length} inquiries</div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-semibold block uppercase">Total Reservation Value</span>
          <div className="text-2xl font-extrabold text-emerald-400 font-outfit mt-1">LKR {totalEarnings.toLocaleString()}</div>
        </div>
      </div>

      {/* Dashboard Sub-Tabs */}
      <div className="flex border-b border-slate-800 space-x-4">
        <button
          onClick={() => setActiveTab('listings')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 transition-all border-b-2 ${
            activeTab === 'listings'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Sprout className="w-4 h-4" />
          <span>My Produce Listings ({myListings.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('reservations')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 transition-all border-b-2 ${
            activeTab === 'reservations'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Reservations Received ({reservations.length})</span>
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
          <span>Buyer Messages & Inquiries ({messages.length})</span>
        </button>
      </div>

      {/* Tab 1: My Listings */}
      {activeTab === 'listings' && (
        <div>
          {myListings.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
              <Sprout className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="text-base font-bold text-white font-outfit">No produce listings published yet</h3>
              <p className="text-xs text-slate-400">Click below to publish your fresh crop harvest to buyers nationwide.</p>
              <button
                onClick={() => { setEditingListing(null); setShowFormModal(true); }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950"
              >
                Add Your First Listing
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myListings.map((listing) => (
                <div key={listing.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 relative">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-2xl">{listing.image_emoji || '🌾'}</span>
                      <div>
                        <h4 className="font-bold text-white text-base">{listing.crop_name}</h4>
                        <span className="text-[11px] text-slate-400">{listing.location}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      listing.status === 'available' ? 'bg-emerald-500/20 text-emerald-300' :
                      listing.status === 'partially_reserved' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {listing.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Remaining Quantity:</span>
                      <span className="font-bold text-white">{listing.quantity} / {listing.initial_quantity} {listing.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Price per unit:</span>
                      <span className="font-bold text-emerald-400">LKR {listing.price.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => { setEditingListing(listing); setShowFormModal(true); }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center space-x-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteListing(listing.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-xs text-rose-300 hover:border-rose-500/30 flex items-center space-x-1"
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
      {activeTab === 'reservations' && (
        <div className="space-y-4">
          {reservations.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center space-y-2">
              <ShoppingBag className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="text-base font-bold text-white font-outfit">No reservations received yet</h3>
              <p className="text-xs text-slate-400">When buyers reserve your produce, order details & buyer contact info will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reservations.map((resv) => (
                <div key={resv.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{resv.image_emoji || '🌾'}</span>
                      <h4 className="font-bold text-white text-base">{resv.crop_name}</h4>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-semibold">
                        Reserved: {resv.reserved_quantity} {resv.unit}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        resv.reservation_method === 'email'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {resv.reservation_method === 'email' ? '✉️ Email Inquiry' : '⚡ Via App'}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                        resv.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                        resv.status === 'denied' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                        'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}>
                        {resv.status === 'accepted' ? '✅ Accepted' : resv.status === 'denied' ? '❌ Declined' : '⏳ Pending Confirmation'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span className="flex items-center space-x-1 text-slate-200">
                        <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                        <strong className="text-white">Buyer: {resv.buyer_name}</strong>
                      </span>
                      {resv.buyer_phone && (
                        <span className="flex items-center space-x-1">
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{resv.buyer_phone}</span>
                        </span>
                      )}
                      <span className="flex items-center space-x-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{resv.buyer_email}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        <span>Buyer Region: {resv.buyer_location}</span>
                      </span>
                    </div>
                    {resv.notes && (
                      <p className="text-xs text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-800 mt-1 italic">
                        "{resv.notes}"
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0 space-y-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total Reservation Value</span>
                      <div className="text-xl font-extrabold text-emerald-400">
                        LKR {resv.total_price.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-slate-500 flex items-center justify-end space-x-1 mt-1">
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
                            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-1 shadow-md shadow-emerald-500/20 transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Accept Order</span>
                          </button>
                          <button
                            onClick={() => handleReservationStatus(resv.id, 'denied')}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-300 hover:border-rose-500/30 text-xs font-bold flex items-center space-x-1 transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Decline Order</span>
                          </button>
                        </>
                      ) : resv.status === 'accepted' ? (
                        <button
                          onClick={() => handleReservationStatus(resv.id, 'denied')}
                          className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 text-rose-300 text-[11px] font-semibold flex items-center space-x-1 transition-all"
                        >
                          <X className="w-3 h-3" />
                          <span>Change to Decline</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReservationStatus(resv.id, 'accepted')}
                          className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold flex items-center space-x-1 transition-all"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Change to Accept</span>
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Buyer Messages & Inquiries */}
      {activeTab === 'messages' && (
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center space-y-2">
              <MessageSquare className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="text-base font-bold text-white font-outfit">No buyer messages received yet</h3>
              <p className="text-xs text-slate-400">When buyers send direct messages or bulk inquiries regarding your produce, they will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-slate-700 transition-all">
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          Direct Inquiry
                        </span>
                        <h4 className="font-bold text-white text-base">{msg.subject || 'Produce Inquiry'}</h4>
                      </div>
                      {msg.crop_name && (
                        <p className="text-xs text-emerald-400 font-semibold">
                          Reference Produce: {msg.crop_name}
                        </p>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(msg.created_at).toLocaleString()}</span>
                    </span>
                  </div>

                  {/* Buyer Contact Header */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                    <span className="flex items-center space-x-1">
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      <strong className="text-white">From: {msg.buyer_name}</strong>
                    </span>
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      <span>Region: {msg.buyer_location}</span>
                    </span>
                    {msg.buyer_phone && (
                      <span className="flex items-center space-x-1">
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{msg.buyer_phone}</span>
                      </span>
                    )}
                    <span className="flex items-center space-x-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <a href={`mailto:${msg.buyer_email}`} className="hover:underline text-cyan-300">{msg.buyer_email}</a>
                    </span>
                  </div>

                  {/* Message Content Box */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs text-slate-200 leading-relaxed font-sans">
                    "{msg.message}"
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end pt-1">
                    <a
                      href={`mailto:${encodeURIComponent(msg.buyer_email)}?subject=${encodeURIComponent(`Re: ${msg.subject || 'Produce Inquiry'}`)}&body=${encodeURIComponent(`Hi ${msg.buyer_name},\n\nThank you for reaching out regarding my farm produce on Govisaviya LK.\n\n`)}`}
                      className="px-3.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center space-x-1.5 transition-all"
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
