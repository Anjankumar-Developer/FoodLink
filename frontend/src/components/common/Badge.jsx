import React from 'react';
import { getStatusStyle } from '../../utils/formatters';

export default function Badge({
  children,
  variant, // 'urgent' | 'warning' | 'active' | 'in transit' | 'default'
  status, // if passing status string to auto-compute
  showDot = true,
  className = '',
}) {
  const currentStatus = variant || status || 'default';
  const style = getStatusStyle(currentStatus);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-md border ${style.badgeBg} ${className}`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`}
          aria-hidden="true"
        />
      )}
      <span className="whitespace-nowrap">{children || status}</span>
    </span>
  );
}
