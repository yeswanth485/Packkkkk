import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface StatsCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'brand' | 'green' | 'yellow' | 'purple';
  loading?: boolean;
}

const colorMap = {
  brand:  { bg: 'bg-brand-500/10',  icon: 'text-brand-400',  border: 'border-brand-500/20'  },
  green:  { bg: 'bg-green-500/10',  icon: 'text-green-400',  border: 'border-green-500/20'  },
  yellow: { bg: 'bg-yellow-500/10', icon: 'text-yellow-400', border: 'border-yellow-500/20' },
  purple: { bg: 'bg-purple-500/10', icon: 'text-purple-400', border: 'border-purple-500/20' },
};

export default function StatsCard({ title, value, sub, icon: Icon, color = 'brand', loading }: StatsCardProps) {
  const c = colorMap[color];
  return (
    <div className={clsx('bg-slate-900 border rounded-2xl p-5', c.border)}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm text-slate-400 font-medium">{title}</p>
        <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center', c.bg)}>
          <Icon className={clsx('w-4.5 h-4.5', c.icon)} style={{ width: '1.1rem', height: '1.1rem' }} />
        </div>
      </div>
      {loading ? (
        <div className="skeleton h-8 w-28 mb-1" />
      ) : (
        <div className="text-2xl font-bold text-white mb-1">{value}</div>
      )}
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}
