import React, { useState, useEffect } from 'react';
import ListingCard from '../components/ListingCard';
import SearchFilterBar from '../components/SearchFilterBar';
import ReserveModal from '../components/ReserveModal';
import ListingFormModal from '../components/ListingFormModal';
import SDG2Banner from '../components/SDG2Banner';
import { apiFetch } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Sprout, SearchX, RefreshCw } from 'lucide-react';

export default function Marketplace({ onShowToast, onOpenAuth, onOpenWriteReviewModal, onViewFarmerReviewsModal, onOpenContactFarmer }) {
  const { user } = useAuth();
  
  const [listings, setListings] = useState([]);
  const [stats, setStats] = useState(null);
  const [reviewsSummary, setReviewsSummary] = useState({});
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchCrop, setSearchCrop] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modals state
  const [reserveModalListing, setReserveModalListing] = useState(null);
  const [listingFormToEdit, setListingFormToEdit] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchListings = async () => {
    try {
      const params = new URLSearchParams();
      if (searchCrop) params.append('crop', searchCrop);
      if (selectedLocation) params.append('location', selectedLocation);
      if (selectedStatus && selectedStatus !== 'all') params.append('status', selectedStatus);

      const data = await apiFetch(`/listings?${params.toString()}`);
      setListings(data.listings || []);
    } catch (err) {
      console.error('Failed to fetch listings:', err.message);
    }
  };

  const fetchStatsAndReviews = async () => {
    try {
      const [statsData, reviewsData] = await Promise.all([
        apiFetch('/stats'),
        apiFetch('/reviews/summary')
      ]);
      setStats(statsData);
      setReviewsSummary(reviewsData.summary || {});
    } catch (err) {
      console.error('Failed to fetch stats or reviews:', err.message);
    }
  };

  useEffect(() => {
    Promise.all([fetchListings(), fetchStatsAndReviews()]).finally(() => setLoading(false));

    // Auto-polling every 4 seconds so stock changes update live without page refresh
    const timer = setInterval(() => {
      fetchListings();
      fetchStatsAndReviews();
    }, 4000);

    const handleFocus = () => {
      fetchListings();
      fetchStatsAndReviews();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', handleFocus);
    };
  }, [searchCrop, selectedLocation, selectedStatus]);

  const handleReset = () => {
    setSearchCrop('');
    setSelectedLocation('');
    setSelectedStatus('all');
  };

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this produce listing?')) return;
    try {
      await apiFetch(`/listings/${listingId}`, { method: 'DELETE' });
      onShowToast('Produce listing deleted successfully.');
      fetchListings();
      fetchStatsAndReviews();
    } catch (err) {
      onShowToast(err.message || 'Failed to delete listing.', 'error');
    }
  };

  const handleAddListingClick = () => {
    if (!user) {
      onShowToast('Please log in or register as a Farmer to list your crop harvest.', 'error');
      onOpenAuth('login');
      return;
    }
    if (user.role !== 'farmer') {
      onShowToast('You are currently signed in as a Buyer. Only Farmers can publish produce listings.', 'error');
      return;
    }
    setListingFormToEdit(null);
    setShowCreateForm(true);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Hero Banner with Live Impact Stats */}
      <SDG2Banner stats={stats} />

      {/* Top Controls: Search Bar & Farmer CTA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight font-outfit">
            Explore Sri Lankan Produce Listings
          </h2>
          <p className="text-xs text-slate-400">
            Real-time stock straight from local farms across Nuwara Eliya, Dambulla, Polonnaruwa, Jaffna & more.
          </p>
        </div>

        <button
          onClick={handleAddListingClick}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 shrink-0 hover:scale-[1.02]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>List New Crop Harvest</span>
        </button>
      </div>

      {/* Interactive Search & Filter Controls */}
      <SearchFilterBar
        searchCrop={searchCrop}
        setSearchCrop={setSearchCrop}
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        onReset={handleReset}
      />

      {/* Listings Grid / Skeleton / Empty State */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 h-64 animate-pulse-subtle flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-6 bg-slate-800 rounded-lg w-2/3" />
                <div className="h-4 bg-slate-800 rounded-lg w-1/2" />
                <div className="h-12 bg-slate-800/60 rounded-xl w-full" />
              </div>
              <div className="h-10 bg-slate-800 rounded-xl w-full" />
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-500">
            <SearchX className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white font-outfit">No produce listings found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              No crop listings matched your selected crop or location filter. Try searching for "Rice", "Carrot", or clearing location filters.
            </p>
          </div>
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all inline-flex items-center space-x-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Search Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onReserve={(l) => setReserveModalListing(l)}
              onEdit={(l) => { setListingFormToEdit(l); setShowCreateForm(true); }}
              onDelete={handleDeleteListing}
              onOpenAuth={onOpenAuth}
              reviewsSummary={reviewsSummary}
              onViewReviews={(fId, fName) => onViewFarmerReviewsModal && onViewFarmerReviewsModal(fId, fName)}
              onOpenContactFarmer={(fId, fName, lId, cName) => onOpenContactFarmer && onOpenContactFarmer(fId, fName, lId, cName)}
            />
          ))}
        </div>
      )}

      {/* Reservation Popup Modal */}
      {reserveModalListing && (
        <ReserveModal
          listing={reserveModalListing}
          onClose={() => setReserveModalListing(null)}
          onSuccess={(msg) => {
            onShowToast(msg);
            fetchListings();
            fetchStatsAndReviews();
          }}
        />
      )}

      {/* Listing Form Popup Modal (Create / Edit) */}
      {showCreateForm && (
        <ListingFormModal
          listingToEdit={listingFormToEdit}
          onClose={() => { setShowCreateForm(false); setListingFormToEdit(null); }}
          onSuccess={(msg) => {
            onShowToast(msg);
            fetchListings();
            fetchStatsAndReviews();
          }}
        />
      )}

    </div>
  );
}
