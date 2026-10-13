export default function Field({ id, label, error, as = 'input', hint, ...props }) {
  const Tag = as;
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined;
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      <Tag id={id} name={id} className="field" aria-invalid={error ? 'true' : undefined} aria-describedby={describedBy} {...props} />
      {hint && !error && <p id={`${id}-hint`} className="mt-2 text-sm text-on-surface-variant">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="field-error">
          <span className="icon !text-[1.8rem]" aria-hidden="true">error</span>{error}
        </p>
      )}
    </div>
  );
}
