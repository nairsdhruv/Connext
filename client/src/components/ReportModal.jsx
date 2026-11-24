import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle, RotateCw } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';

export const ReportModal = ({ targetType = 'hotspot', targetId, targetName, onClose }) => {
  const { notifySuccess, notifyError } = useNotification();
  const [reason, setReason] = useState('inappropriate');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/reports', {
        targetType,
        targetId,
        reason,
        details
      });
      if (res.data?.success) {
        notifySuccess('Report received. Our moderation team will review this promptly.');
        onClose();
      }
    } catch (err) {
      notifyError(err.response?.data?.message || 'Could not submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-dark-900 border border-dark-700 rounded-3xl shadow-2xl overflow-hidden p-6 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-amber-400">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="text-lg font-bold text-white">Report Concern</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-dark-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 mb-4">
          Reporting: <span className="font-semibold text-white">{targetName || targetId}</span>. Help us maintain a respectful and safe community for everyone.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary"
            >
              <option value="inappropriate">Inappropriate or offensive content</option>
              <option value="harassment">Harassment or bullying</option>
              <option value="safety_concern">Physical safety or scam concern</option>
              <option value="spam">Spam or misleading information</option>
              <option value="other">Other issue</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Additional Details (Optional)
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide context to assist with review..."
              maxLength={500}
              className="w-full bg-dark-800 border border-dark-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-300 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5"
            >
              {submitting ? <RotateCw className="w-4 h-4 animate-spin" /> : <span>Submit Report</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
