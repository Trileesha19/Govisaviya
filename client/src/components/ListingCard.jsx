import { useState } from 'react';
import { MapPin, Star, ShoppingBag, Edit3, Trash2, MessageSquare, Mail, ChevronDown, CalendarDays, Leaf } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ListingCard({ listing, onReserve, onEdit, onDelete, onOpenAuth, reviewsSummary, onViewReviews, onOpenWriteReview, onOpenContactFarmer }) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const owner = user?.role === 'farmer' && user.id === listing.farmer_id;
  const available = Number(listing.quantity) > 0 && listing.status !== 'reserved';
  const percentage = Math.min(100, Math.max(0, Number(listing.quantity) / (Number(listing.initial_quantity) || 1) * 100));
  const rating = reviewsSummary?.[listing.farmer_id];
  const categoryTone = /Rice|Grain/.test(listing.category) ? 'gold' : /Chili|Spice/.test(listing.category) ? 'coral' : /Root|Tuber/.test(listing.category) ? 'peach' : 'green';
  const status = !available ? 'Fully reserved' : listing.status === 'partially_reserved' ? 'Partially reserved' : 'Available';
  return <article className={`produce-card ${!available ? 'unavailable' : ''}`}>
    <div className={`produce-portrait tone-${categoryTone}`}><span className={`stock-badge ${available ? 'in-stock' : 'out-of-stock'}`}><span />{status}</span><span className="produce-emoji" role="img" aria-label={`${listing.crop_name} illustration`}>{listing.image_emoji || '🌱'}</span><span className="portrait-caption"><Leaf size={13} /> {listing.category || 'Local produce'}</span></div>
    <div className="produce-card-body">
      <div className="produce-location"><MapPin size={14} />{listing.location}</div><h3>{listing.crop_name}</h3>
      <div className="farmer-row"><span className="farmer-avatar">{listing.farmer_name?.charAt(0) || 'F'}</span><span className="farmer-name">{listing.farmer_name}</span><button className="farmer-rating" onClick={() => onViewReviews?.(listing.farmer_id, listing.farmer_name)} aria-label={`Read reviews for ${listing.farmer_name}`}><Star size={14} fill={rating ? 'currentColor' : 'none'} />{rating ? `${rating.avgRating} (${rating.totalReviews})` : 'New'}</button></div>
      <div className="stock-row"><span>{available ? 'Available to reserve' : 'No stock remaining'}</span><strong>{Number(listing.quantity).toLocaleString()} <span>{listing.unit}</span></strong></div><div className="stock-track" aria-hidden="true"><span style={{ width: `${percentage}%` }} /></div>
      <div className="price-row"><div className="produce-price"><span>LKR</span> {Number(listing.price).toLocaleString()}<small> / {listing.unit}</small></div>{owner ? <div className="owner-actions"><button className="icon-button" onClick={() => onEdit(listing)} aria-label={`Edit ${listing.crop_name}`}><Edit3 size={17} /></button><button className="icon-button danger" onClick={() => onDelete(listing.id)} aria-label={`Delete ${listing.crop_name}`}><Trash2 size={17} /></button></div> : user?.role === 'farmer' ? <span className="farmer-view">Farmer view</span> : <button className="button button-primary reserve-button" disabled={!available} onClick={() => user ? onReserve(listing) : onOpenAuth('login')}><ShoppingBag size={16} />{available ? 'Reserve' : 'Reserved'}</button>}</div>
      <button className="details-toggle" aria-expanded={expanded} aria-controls={`produce-details-${listing.id}`} onClick={() => setExpanded(!expanded)}>{expanded ? 'Less detail' : 'Details & contact'}<ChevronDown size={16} className={expanded ? 'rotated' : ''} /></button>
      {expanded && <div id={`produce-details-${listing.id}`} className="produce-details"><p>{listing.description || 'Contact the farmer for more information about this harvest.'}</p>{listing.harvest_date && <span className="harvest-date"><CalendarDays size={15} />Harvest date: {new Date(`${listing.harvest_date.slice(0, 10)}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}{!owner && user?.role !== 'farmer' && <div className="detail-actions"><button onClick={() => user ? onOpenContactFarmer?.(listing.farmer_id, listing.farmer_name, listing.id, listing.crop_name) : onOpenAuth('login')}><MessageSquare size={15} /> Message</button><button onClick={() => onOpenWriteReview?.(listing.farmer_id, listing.farmer_name, listing.id, listing.crop_name)}><Star size={15} /> Review</button>{user && listing.farmer_email && <a href={`mailto:${encodeURIComponent(listing.farmer_email)}?subject=${encodeURIComponent(`Inquiry about ${listing.crop_name}`)}`}><Mail size={15} /> Email</a>}</div>}</div>}
    </div>
  </article>;
}
