import Modal from './Modal';
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

    if (!formData.crop_name.trim() || !Number.isFinite(Number(formData.quantity)) || Number(formData.quantity) < (listingToEdit ? 0 : 0.01) || !Number.isFinite(Number(formData.price)) || Number(formData.price) <= 0 || !formData.location) {
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


      onSuccess(result.message);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save produce listing.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Harvest listing" onClose={onClose} className="max-w-xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#173f35] font-outfit">
                {listingToEdit ? 'Edit Produce Listing' : 'List Fresh Harvest'}
              </h2>
              <p className="text-sm text-slate-600">Directly connect with wholesale and retail buyers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 rounded-lg text-slate-600 hover:text-[#173f35] hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          
          {error && (
            <div role="alert" className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Crop Name */}
          <div className="space-y-1">
            <label htmlFor="listing-crop_name" className="text-sm font-semibold text-slate-700">Crop Name *</label>
            <input
              type="text"
              id="listing-crop_name"
              name="crop_name"
              value={formData.crop_name}
              onChange={handleChange}
              placeholder="e.g. Nuwara Eliya Fresh Carrots"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-[#173f35] focus:border-emerald-600 focus:outline-none"
              required
            />
          </div>

          {/* Category & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="listing-category" className="text-sm font-semibold text-slate-700">Category</label>
              <select
                id="listing-category"
              name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-[#173f35] focus:border-emerald-600 focus:outline-none"
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="listing-location" className="text-sm font-semibold text-slate-700">Farm Location *</label>
              <select
                id="listing-location"
              name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-[#173f35] focus:border-emerald-600 focus:outline-none"
              >
                {SRI_LANKAN_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
              </select>
            </div>
          </div>

          {/* Quantity, Unit & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label htmlFor="listing-quantity" className="text-sm font-semibold text-slate-700">Quantity *</label>
              <input
                type="number"
                id="listing-quantity"
              name="quantity"
                min={listingToEdit ? 0 : 0.01}
                step="any"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="500"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-[#173f35] focus:border-emerald-600 focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="listing-unit" className="text-sm font-semibold text-slate-700">Unit</label>
              <select
                id="listing-unit"
              name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-[#173f35] focus:border-emerald-600 focus:outline-none"
              >
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="listing-price" className="text-sm font-semibold text-slate-700">Price (LKR per unit) *</label>
              <input
                type="number"
                id="listing-price"
              name="price"
                min="0.01"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                placeholder="240"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-[#173f35] focus:border-emerald-600 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Harvest Date */}
          <div className="space-y-1">
            <label htmlFor="listing-harvest_date" className="text-sm font-semibold text-slate-700">Harvest Date</label>
            <input
              type="date"
              id="listing-harvest_date"
              name="harvest_date"
              value={formData.harvest_date}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-[#173f35] focus:border-emerald-600 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label htmlFor="listing-description" className="text-sm font-semibold text-slate-700">Crop Description & Quality Notes</label>
            <textarea
              id="listing-description"
              name="description"
              rows="3"
              maxLength={2000}
              value={formData.description}
              onChange={handleChange}
              placeholder="Crisp high-altitude organic carrots harvested from Lovers Leap slope..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-[#173f35] focus:border-emerald-600 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-[2] py-3 rounded-xl text-sm font-bold bg-[#18764b] hover:bg-[#125d3b] text-white shadow-lg  transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {listingToEdit ? <Edit className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
              <span>{submitting ? 'Saving Listing...' : listingToEdit ? 'Update Listing' : 'Publish Listing'}</span>
            </button>
          </div>

        </form>
    </Modal>
  );
}
