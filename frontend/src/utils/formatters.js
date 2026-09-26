/**
 * FOODLINK AI - Utility Formatters
 */

export function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatWeight(kg) {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(1)} tons`;
  }
  return `${kg} kg`;
}

export function getStatusStyle(status) {
  switch (status?.toLowerCase()) {
    case 'urgent':
    case 'critical':
      return {
        badgeBg: 'bg-red-50 text-red-700 border-red-200',
        dot: 'bg-red-500',
        border: 'border-red-500',
        text: 'text-red-700',
      };
    case 'warning':
    case 'near capacity':
    case 'medium':
      return {
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
        border: 'border-amber-500',
        text: 'text-amber-700',
      };
    case 'active':
    case 'accepting':
    case 'completed':
    case 'matched':
    case 'available':
      return {
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
        border: 'border-emerald-500',
        text: 'text-emerald-700',
      };
    case 'in transit':
    case 'on mission':
    case 'matching':
    case 'info':
      return {
        badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
        border: 'border-blue-500',
        text: 'text-blue-700',
      };
    default:
      return {
        badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
        border: 'border-slate-300',
        text: 'text-slate-600',
      };
  }
}
