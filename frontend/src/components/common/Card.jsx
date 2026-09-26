import React from 'react';

export default function Card({
  children,
  className = '',
  title,
  subtitle,
  action,
  headerClassName = '',
  bodyClassName = '',
  ...props
}) {
  return (
    <div
      className={`bg-white/90 rounded-2xl border border-slate-200/80 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.34)] overflow-hidden backdrop-blur-sm ${className}`}
      {...props}
    >
      {(title || subtitle || action) && (
        <div className={`px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/80 flex items-center justify-between gap-4 ${headerClassName}`}>
          <div>
            {title && <h3 className="text-base font-semibold text-slate-900 tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
    </div>
  );
}
