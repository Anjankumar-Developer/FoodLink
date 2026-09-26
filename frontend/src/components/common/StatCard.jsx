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
      className={`bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs transition-shadow hover:shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          {title}
        </span>
        {Icon && (
          <div className={`p-2 rounded-lg shrink-0 ${iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums tracking-tight">
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-semibold font-mono tabular-nums ${
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
