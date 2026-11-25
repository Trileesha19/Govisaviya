import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { LayoutGrid, Carrot, Wheat, Flame, Sprout, Leaf, Plus, SearchX, RefreshCw, ChevronDown, ShoppingBasket, Handshake, MessageCircle, AlertCircle } from 'lucide-react';
import ListingCard from '../components/ListingCard';
import SearchFilterBar from '../components/SearchFilterBar';
import ReserveModal from '../components/ReserveModal';
import ListingFormModal from '../components/ListingFormModal';
import SDG2Banner from '../components/SDG2Banner';
import { apiFetch } from '../services/api';
import { useAuth } from '../context/AuthContext';

const categories = [
  { name: 'All produce', value: '', icon: LayoutGrid },
  { name: 'Vegetables', value: 'Vegetables', icon: Carrot },
  { name: 'Grains & rice', value: 'Grains & Rice', icon: Wheat },
  { name: 'Spices & chili', value: 'Spices & Chili', icon: Flame },
  { name: 'Roots & tubers', value: 'Roots & Tubers', icon: Sprout },
  { name: 'Coconut', value: 'Coconut', icon: Leaf },
];

export default function Marketplace({ onShowToast, onOpenAuth, onOpenWriteReviewModal, onViewFarmerReviewsModal, onOpenContactFarmer }) {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [stats, setStats] = useState(null);
  const [reviewsSummary, setReviewsSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchCrop, setSearchCrop] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [reserveModalListing, setReserveModalListing] = useState(null);
  const [listingFormToEdit, setListingFormToEdit] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const requestRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++requestRef.current;
    setRefreshing(true);
    const [listingResult, statsResult, reviewsResult] = await Promise.allSettled([apiFetch('/listings'), apiFetch('/stats'), apiFetch('/reviews/summary')]);
    if (requestId !== requestRef.current) return;
    if (listingResult.status === 'fulfilled') { setListings(listingResult.value.listings || []); setError(''); }
    else setError('We couldn’t refresh the marketplace. Please try again before reserving produce.');
    if (statsResult.status === 'fulfilled') setStats(statsResult.value);
    if (reviewsResult.status === 'fulfilled') setReviewsSummary(reviewsResult.value.summary || {});
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    refresh();
    const refreshWhenVisible = () => { if (!document.hidden) refresh(); };
    const timer = setInterval(refreshWhenVisible, 60000);
    window.addEventListener('govisaviya_review_submitted', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => { ++requestRef.current; clearInterval(timer); window.removeEventListener('govisaviya_review_submitted', refreshWhenVisible); document.removeEventListener('visibilitychange', refreshWhenVisible); };
  }, [refresh]);

  const locations = useMemo(() => [...new Set(listings.map(item => item.location).filter(Boolean))].sort(), [listings]);
  const filtered = useMemo(() => {
    const query = searchCrop.toLowerCase().trim();
    const items = listings.filter(item => (!query || `${item.crop_name} ${item.category} ${item.farmer_name}`.toLowerCase().includes(query)) && (!selectedLocation || item.location === selectedLocation) && (!category || item.category === category) && (selectedStatus === 'all' || (selectedStatus === 'in-stock' ? item.quantity > 0 && item.status !== 'reserved' : item.status === selectedStatus)));
    return items.sort((a, b) => sort === 'price-low' ? a.price - b.price : sort === 'price-high' ? b.price - a.price : sort === 'name' ? a.crop_name.localeCompare(b.crop_name) : new Date(b.created_at || 0) - new Date(a.created_at || 0) || b.id - a.id);
  }, [listings, searchCrop, selectedLocation, selectedStatus, category, sort]);
  const hasFilters = Boolean(searchCrop || selectedLocation || category || selectedStatus !== 'all');
  const resetFilters = () => { setSearchCrop(''); setSelectedLocation(''); setSelectedStatus('all'); setCategory(''); };
  const listHarvest = () => {
    if (!user) return onOpenAuth('register', 'farmer');
    if (user.role !== 'farmer') return onShowToast('Sign in with a farmer account to list your harvest.', 'error');
    setListingFormToEdit(null); setShowCreateForm(true);
  };
  const deleteListing = async (id) => {
    if (!window.confirm('Delete this produce listing? This action cannot be undone.')) return;
    try { await apiFetch(`/listings/${id}`, { method: 'DELETE' }); onShowToast('Listing deleted.'); refresh(); }
    catch (err) { onShowToast(err.message || 'Could not delete this listing. Please try again.', 'error'); }
  };

  return <>
    <SDG2Banner stats={stats} onListHarvest={listHarvest} />
    <section id="produce" className="produce-section" aria-labelledby="produce-heading">
      <div className="section-heading"><div><span className="section-kicker">THE MARKETPLACE</span><h2 id="produce-heading">Good food starts with a good harvest.</h2><p className="section-description">Find your next fresh pick, straight from local growers.</p></div><div className="section-heading-actions"><button className="button button-secondary" onClick={listHarvest}><Plus size={17} /> List your harvest</button></div></div>
      <div className="category-tabs" role="group" aria-label="Produce category">{categories.map(({ name, value, icon: Icon }) => <button key={name} className={`category-tab ${category === value ? 'active' : ''}`} aria-pressed={category === value} onClick={() => setCategory(value)}><Icon size={19} strokeWidth={1.7} />{name}<span className="category-count">{listings.filter(item => !value || item.category === value).length}</span></button>)}</div>
      <SearchFilterBar {...{ searchCrop, setSearchCrop, selectedLocation, setSelectedLocation, selectedStatus, setSelectedStatus, locations, hasFilters }} onReset={resetFilters} />
      <div className="results-toolbar"><p className="results-count" role="status" aria-live="polite">{loading ? 'Finding the local harvest…' : <><strong>{filtered.length}</strong> {filtered.length === 1 ? 'listing' : 'listings'}{hasFilters ? ' matching your search' : ' to explore'}</>}</p><div className="sort-control"><button className="icon-button" aria-label="Refresh listings" title="Refresh listings" onClick={refresh} disabled={refreshing}><RefreshCw size={16} className={refreshing ? 'spinning' : ''} /></button><label htmlFor="produce-sort">Sort by:</label><select id="produce-sort" value={sort} onChange={e => setSort(e.target.value)}><option value="newest">Newest first</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name: A to Z</option></select><ChevronDown size={14} /></div></div>
      {error && <div className="error-banner" role="alert"><AlertCircle size={20} /><span>{error}{listings.length > 0 && ' Previously loaded listings are shown below.'}</span><button onClick={refresh} disabled={refreshing}>Try again</button></div>}
      {loading ? <div className="listing-grid" aria-label="Loading listings" aria-busy="true">{Array.from({ length: 6 }, (_, index) => <div key={index} className="skeleton-card"><div className="skeleton-block" /><div /><div /><div /></div>)}</div> : filtered.length ? <div className="listing-grid">{filtered.map(listing => <ListingCard key={listing.id} listing={listing} onReserve={setReserveModalListing} onEdit={item => { setListingFormToEdit(item); setShowCreateForm(true); }} onDelete={deleteListing} onOpenAuth={onOpenAuth} reviewsSummary={reviewsSummary} onViewReviews={onViewFarmerReviewsModal} onOpenWriteReview={(farmerId, farmerName, listingId, cropName) => onOpenWriteReviewModal({ farmerId, farmerName, listingId, cropName })} onOpenContactFarmer={onOpenContactFarmer} />)}</div> : !error && <div className="empty-state"><SearchX size={38} /><h3>{hasFilters ? 'No harvests match just yet.' : 'The next harvest is on its way.'}</h3><p>{hasFilters ? 'Try another crop or growing region, or clear your filters to explore everything.' : 'Farmers can add their produce to get the marketplace growing.'}</p><button className="button button-primary" onClick={hasFilters ? resetFilters : listHarvest}>{hasFilters ? 'Clear filters' : 'List your harvest'}</button></div>}
    </section>
    <section id="how-it-works" className="how-section" aria-labelledby="how-heading"><div className="section-heading"><div><span className="section-kicker">A SHORTER JOURNEY TO YOUR TABLE</span><h2 id="how-heading">Local connections. Simple steps.</h2></div></div><div className="how-grid">{[{ icon: ShoppingBasket, title: 'Find your fresh pick', copy: 'Explore produce by crop, region, and availability. See prices and stock before you reserve.' }, { icon: MessageCircle, title: 'Get to know your grower', copy: 'Read farmer reviews or send a message to discuss the harvest and collection details.' }, { icon: Handshake, title: 'Reserve with confidence', copy: 'Request the quantity you need, then check your reservations for the farmer’s response.' }].map(({ icon: Icon, title, copy }) => <div className="how-card" key={title}><span className="how-icon"><Icon size={25} strokeWidth={1.6} /></span><h3>{title}</h3><p>{copy}</p></div>)}</div></section>
    <section id="our-purpose" className="purpose-panel" aria-labelledby="purpose-heading"><div className="purpose-badge"><Wheat size={30} /><span>SDG 2<br /><strong>ZERO HUNGER</strong></span></div><div className="purpose-copy"><span className="section-kicker">SMALL CONNECTIONS. SHARED PURPOSE.</span><h2 id="purpose-heading">A stronger food community, together.</h2><p>We connect Sri Lankan farmers and buyers directly, with the goal of fairer access to markets and less food going to waste.</p></div><Sprout className="purpose-decoration" size={92} strokeWidth={1} aria-hidden="true" /></section>
    {reserveModalListing && <ReserveModal listing={reserveModalListing} onClose={() => setReserveModalListing(null)} onSuccess={message => { onShowToast(message); refresh(); }} />}
    {showCreateForm && <ListingFormModal listingToEdit={listingFormToEdit} onClose={() => { setShowCreateForm(false); setListingFormToEdit(null); }} onSuccess={message => { onShowToast(message); refresh(); }} />}
  </>;
}
