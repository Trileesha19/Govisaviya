import Modal from './Modal';
import React, { useState } from 'react';
import { X, MessageSquare, Send, User, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../services/api';

export default function ContactFarmerModal({ farmerId, farmerName, listingId, cropName, onClose, onSuccess }) {
  const [subject, setSubject] = useState(cropName ? `Inquiry regarding ${cropName}` : 'Produce Supply Inquiry');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!message.trim()) {
      setError('Please enter your message for the farmer.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await apiFetch('/messages', {
        method: 'POST',
        body: {
          farmer_id: farmerId,
          listing_id: listingId || null,
          subject: subject.trim(),
          message: message.trim()
        }
      });

      onSuccess(data.message);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to send message.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Contact farmer" onClose={onClose} className="max-w-lg">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#173f35] font-outfit">Contact Farmer</h2>
              <p className="text-sm text-slate-600">Send direct inquiry or bulk order message</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-slate-600 hover:text-[#173f35] hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Recipient Summary */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-semibold">Recipient Farmer:</span>
              <span className="font-bold text-[#173f35]">{farmerName}</span>
            </div>
            {cropName && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-600 font-semibold">Crop Reference:</span>
                <span className="font-bold text-emerald-700">{cropName}</span>
              </div>
            )}
          </div>

          {/* Subject Field */}
          <div className="space-y-1">
            <label htmlFor="contact-subject" className="text-sm font-semibold text-slate-700">Subject</label>
            <input
              type="text"
              id="contact-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Bulk produce order inquiry..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-[#173f35] focus:border-cyan-600 focus:outline-none"
              required
            />
          </div>

          {/* Message Textarea */}
          <div className="space-y-1">
            <label htmlFor="contact-message" className="text-sm font-semibold text-slate-700">Message Text *</label>
            <textarea
              rows="4"
              maxLength={2000}
              id="contact-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi! I am interested in your produce. Please let me know your pickup options and weekly availability..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-[#173f35] placeholder-slate-500 focus:outline-none focus:border-cyan-600"
              required
            />
          </div>

          {/* Submit Action */}
          <div className="flex items-center space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-[2] py-2.5 rounded-xl text-sm font-bold bg-[#18764b] hover:bg-[#125d3b] text-white shadow-lg  transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Sending Message...' : 'Send Message'}</span>
            </button>
          </div>

        </form>
    </Modal>
  );
}
