import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({
  message = 'Loading operational telemetry...',
  className = '',
  rows = 3,
}) {
  return (
    <div className={`p-8 text-center flex flex-col items-center justify-center ${className}`}>
      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
      <p className="text-sm font-medium text-slate-600">{message}</p>
      
      {/* Skeleton bar indicators */}
      <div className="w-full max-w-sm mt-6 space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-3 bg-slate-100 rounded-full animate-pulse"
            style={{ width: `${85 - i * 15}%`, margin: '0 auto' }}
          />
        ))}
      </div>
    </div>
  );
}
