import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import '../account.css';

export default function Modal({ children, title, onClose, className = '' }) {
  const panelRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const app = document.getElementById('root');
    const previousInert = app?.inert;
    document.body.style.overflow = 'hidden';
    if (app) app.inert = true;
    const frame = requestAnimationFrame(() => {
      const firstField = panelRef.current?.querySelector('input:not([disabled]), textarea, select');
      (firstField || panelRef.current)?.focus();
    });
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current?.();
      }
      if (event.key !== 'Tab') return;
      const controls = [...panelRef.current.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]')]
        .filter(element => element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first) { event.preventDefault(); panelRef.current.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panelRef.current)) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (app) app.inert = previousInert;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  return createPortal(
    <div className="account-dialog-overlay">
      <section ref={panelRef} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className={`account-dialog ${className}`}>
        {children}
      </section>
    </div>,
    document.body
  );
}
