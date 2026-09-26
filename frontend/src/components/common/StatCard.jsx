import React from 'react';

export default function StatCard({
  title,
  value,
  trend,
  trendPositive = true,
  description,
  icon: Icon,
  iconBg = 'bg-emerald-50 text-emerald-600',
  className = '',
}) {
  return (
    <div
      className={`group rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/90 p-5 shadow-[0_18px_35px_-26px_rgba(15,23,42,0.38)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_45px_-22px_rgba(15,23,42,0.42)] ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          {title}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-xl shrink-0 shadow-inner ${iconBg}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums tracking-tight">
          {value}
        </span>
        {trend && (
          <span
            className={`text-[11px] font-semibold font-mono tabular-nums ${
              trendPositive ? 'text-emerald-600' : 'text-amber-600'
            }`}
          >
            {trend}
          </span>
        )}
      </div>

      {description && (
        <p className="mt-1 text-xs text-slate-500 leading-relaxed">{description}</p>
      )}
    </div>
  );
}
