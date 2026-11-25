import { Search, MapPin, SlidersHorizontal, X, ChevronDown } from 'lucide-react';

export default function SearchFilterBar({ searchCrop, setSearchCrop, selectedLocation, setSelectedLocation, selectedStatus, setSelectedStatus, locations, onReset, hasFilters }) {
  return <div className="search-panel" role="search" aria-label="Find produce">
    <div className="search-input-wrap"><Search size={20} /><input aria-label="Search produce" type="search" value={searchCrop} onChange={e => setSearchCrop(e.target.value)} placeholder="What are you looking for?" />{searchCrop && <button className="clear-search" onClick={() => setSearchCrop('')} aria-label="Clear search"><X size={17} /></button>}</div>
    <div className="select-wrap"><MapPin size={18} /><select aria-label="Growing region" value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)}><option value="">All locations</option>{locations.map(location => <option key={location}>{location}</option>)}</select><ChevronDown size={16} /></div>
    <div className="select-wrap"><SlidersHorizontal size={18} /><select aria-label="Availability" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}><option value="all">All availability</option><option value="in-stock">In stock</option><option value="available">Available</option><option value="partially_reserved">Partially reserved</option><option value="reserved">Fully reserved</option></select><ChevronDown size={16} /></div>
    {hasFilters && <button className="reset-button" onClick={onReset}><X size={15} /> Reset</button>}
  </div>;
}
