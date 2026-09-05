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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-outfit">Contact Farmer</h2>
              <p className="text-xs text-slate-400">Send direct inquiry or bulk order message</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Recipient Summary */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold">Recipient Farmer:</span>
              <span className="font-bold text-white">{farmerName}</span>
            </div>
            {cropName && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                <span className="text-slate-400 font-semibold">Crop Reference:</span>
                <span className="font-bold text-emerald-400">{cropName}</span>
              </div>
            )}
          </div>

          {/* Subject Field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Bulk produce order inquiry..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-cyan-500 focus:outline-none"
              required
            />
          </div>

          {/* Message Textarea */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Message Text *</label>
            <textarea
              rows="4"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi! I am interested in your produce. Please let me know your pickup options and weekly availability..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          {/* Submit Action */}
          <div className="flex items-center space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-[2] py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Sending Message...' : 'Send Message'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
