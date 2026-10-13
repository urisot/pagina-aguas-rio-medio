import { useEffect, useRef } from 'react';

/** Modal con el estilo del sitio (reemplaza a confirm()). */
export default function ConfirmDialog({ open, title, children, confirmLabel, cancelLabel = 'Cancelar', danger = false, loading = false, onConfirm, onCancel }) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    cancelRef.current?.focus();
    const onKey = (event) => event.key === 'Escape' && onCancel();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-5 backdrop-blur-[12px]" style={{ background: 'rgb(29 53 87 / 0.4)' }}>
      <div role="dialog" aria-modal="true" aria-labelledby="dialog-title" className="w-full max-w-lg animate-rise rounded-3xl bg-white p-8 shadow-modal">
        <span className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${danger ? 'bg-error-container text-error' : 'bg-surface-container text-primary'}`}>
          <span className="icon icon-fill" aria-hidden="true">{danger ? 'warning' : 'help'}</span>
        </span>
        <h2 id="dialog-title" className="font-display text-2xl font-extrabold">{title}</h2>
        <div className="mt-3 text-base text-on-surface-variant">{children}</div>
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" ref={cancelRef} className="btn btn-ghost" onClick={onCancel} disabled={loading}>{cancelLabel}</button>
          <button type="button" className={`btn ${danger ? '!bg-error text-white' : 'btn-primary'}`} onClick={onConfirm} disabled={loading}>
            {loading ? 'Enviando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
