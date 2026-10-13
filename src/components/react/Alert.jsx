const styles = {
  success: { box: 'border-[#2e7d32]/25 bg-[#eaf7e8] text-[#1b5e20]', icon: 'check_circle' },
  error: { box: 'border-error/25 bg-error-container text-on-error-container', icon: 'error' },
  warning: { box: 'border-warn/25 bg-warn-container text-warn', icon: 'schedule' },
  info: { box: 'border-primary-brand/20 bg-[#eaf3f8] text-primary', icon: 'info' },
};

export default function Alert({ type = 'info', title, children }) {
  const style = styles[type];
  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`flex gap-3 rounded-xl border p-4 text-sm ${style.box}`}
    >
      <span className="icon icon-fill !text-[2.4rem]" aria-hidden="true">{style.icon}</span>
      <div className="space-y-1">
        {title && <p className="font-display text-base font-bold">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}
