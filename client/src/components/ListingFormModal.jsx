import React, { useState, useEffect } from 'react';
import { X, Sprout, PlusCircle, Edit, AlertCircle } from 'lucide-react';
import { apiFetch } from '../services/api';

const SRI_LANKAN_LOCATIONS = [
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

const CATEGORIES = [
  'Vegetables',
  'Grains & Rice',
  'Spices & Chili',
  'Roots & Tubers',
  'Coconut',
  'Fruits'
];

const UNITS = ['kg', 'sacks', 'crates', 'items', 'bundles'];

export default function ListingFormModal({ listingToEdit, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    crop_name: '',
    category: 'Vegetables',
    quantity: '',
    unit: 'kg',
    price: '',
    location: 'Nuwara Eliya',
    harvest_date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (listingToEdit) {
      setFormData({
        crop_name: listingToEdit.crop_name || '',
        category: listingToEdit.category || 'Vegetables',
        quantity: listingToEdit.quantity !== undefined ? listingToEdit.quantity : '',
        unit: listingToEdit.unit || 'kg',
        price: listingToEdit.price !== undefined ? listingToEdit.price : '',
        location: listingToEdit.location || 'Nuwara Eliya',
        harvest_date: listingToEdit.harvest_date || new Date().toISOString().split('T')[0],
        description: listingToEdit.description || ''
      });
    }
  }, [listingToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.crop_name || !formData.quantity || !formData.price || !formData.location) {
      setError('Please fill in crop name, quantity, price, and location.');
      return;
    }

    setSubmitting(true);
    try {
      let result;
      if (listingToEdit) {
        result = await apiFetch(`/listings/${listingToEdit.id}`, {
          method: 'PUT',
          body: formData
        });
      } else {
        result = await apiFetch('/listings', {
          method: 'POST',
          body: formData
        });
      }

      if (result.listing) {
        const custom = JSON.parse(localStorage.getItem('govisaviya_custom_listings') || '[]');
        const updatedList = [result.listing, ...custom.filter(l => l.id !== result.listing.id)];
        localStorage.setItem('govisaviya_custom_listings', JSON.stringify(updatedList));
      }

      onSuccess(result.message);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save produce listing.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-outfit">
                {listingToEdit ? 'Edit Produce Listing' : 'List Fresh Harvest'}
              </h2>
              <p className="text-xs text-slate-400">Directly connect with wholesale and retail buyers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Crop Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Crop Name *</label>
            <input
              type="text"
              name="crop_name"
              value={formData.crop_name}
              onChange={handleChange}
              placeholder="e.g. Nuwara Eliya Fresh Carrots"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>

          {/* Category & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Farm Location *</label>
              <select
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                {SRI_LANKAN_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
              </select>
            </div>
          </div>

          {/* Quantity, Unit & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Quantity *</label>
              <input
                type="number"
                name="quantity"
                min="1"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="500"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Unit</label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Price (LKR per unit) *</label>
              <input
                type="number"
                name="price"
                min="1"
                value={formData.price}
                onChange={handleChange}
                placeholder="240"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Harvest Date */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Harvest Date</label>
            <input
              type="date"
              name="harvest_date"
              value={formData.harvest_date}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Crop Description & Quality Notes</label>
            <textarea
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              placeholder="Crisp high-altitude organic carrots harvested from Lovers Leap slope..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-[2] py-3 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {listingToEdit ? <Edit className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
              <span>{submitting ? 'Saving Listing...' : listingToEdit ? 'Update Listing' : 'Publish Listing'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
