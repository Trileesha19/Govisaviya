import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import '../account.css';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;
  const isError = toast.type === 'error';
  return (
    <div className={`account-toast ${isError ? 'is-error' : ''}`} role={isError ? 'alert' : 'status'}>
      {isError ? <AlertCircle /> : <CheckCircle2 />}
      <span>{toast.message}</span>
      <button type="button" aria-label="Dismiss notification" onClick={onClose}><X size={16} /></button>
    </div>
  );
}
