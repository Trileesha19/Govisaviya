import React from 'react';
import { Search, MapPin, Filter, X, RefreshCw, CheckCircle, Tag } from 'lucide-react';

const SRI_LANKAN_LOCATIONS = [
  'All Locations',
  'Nuwara Eliya',
  'Dambulla',
  'Polonnaruwa',
  'Jaffna',
  'Anuradhapura',
  'Kurunegala',
  'Kandy',
  'Badulla',
  'Matale',
  'Hambantota'
];

const POPULAR_CROPS = [
  'All Crops',
  'Rice',
  'Carrot',
  'Pumpkin',
  'Tomato',
  'Cabbage',
  'Beans',
  'Brinjal',
  'Big Onion',
  'Green Chili',
  'Coconut',
  'Manioc',
  'Sweet Potato'
];

export default function SearchFilterBar({
  searchCrop,
  setSearchCrop,
  selectedLocation,
  setSelectedLocation,
  selectedStatus,
  setSelectedStatus,
  onReset
}) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-lg mb-8 space-y-4 backdrop-blur-md">
      
      {/* Primary Search Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        
        {/* Crop Search Input */}
        <div className="sm:col-span-5 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchCrop}
            onChange={(e) => setSearchCrop(e.target.value)}
            placeholder="Search crop name (e.g., Carrot, Samba Rice, Chili)..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
          />
          {searchCrop && (
            <button
              onClick={() => setSearchCrop('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Location Dropdown */}
        <div className="sm:col-span-4 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400">
            <MapPin className="w-4 h-4" />
          </div>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none cursor-pointer"
          >
            {SRI_LANKAN_LOCATIONS.map((loc) => (
              <option key={loc} value={loc === 'All Locations' ? '' : loc}>
                {loc}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            <Filter className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Status Filter */}
        <div className="sm:col-span-3 relative">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none cursor-pointer"
          >
            <option value="all">All Availability Statuses</option>
            <option value="available">Available Stock</option>
            <option value="partially_reserved">Partially Reserved</option>
            <option value="reserved">Sold Out / Reserved</option>
          </select>
        </div>

      </div>

      {/* Quick Tag Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
        <span className="text-xs font-semibold text-slate-400 flex items-center space-x-1 mr-1">
          <Tag className="w-3.5 h-3.5 text-emerald-400" />
          <span>Quick Crops:</span>
        </span>

        {POPULAR_CROPS.map((crop) => {
          const isSelected = (crop === 'All Crops' && !searchCrop) || (searchCrop.toLowerCase() === crop.toLowerCase());
          return (
            <button
              key={crop}
              onClick={() => setSearchCrop(crop === 'All Crops' ? '' : crop)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm shadow-emerald-500/30'
                  : 'bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {crop}
            </button>
          );
        })}

        {(searchCrop || selectedLocation || selectedStatus !== 'all') && (
          <button
            onClick={onReset}
            className="ml-auto text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center space-x-1 transition-all"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

    </div>
  );
}
