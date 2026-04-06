'use client';
import { useState, useEffect, useCallback } from 'react';
import { api, Analytics, Order } from '@/lib/api';
import AnalyticsCharts from '@/components/dashboard/AnalyticsCharts';
import StatsCard from '@/components/dashboard/StatsCard';
import { Package, TrendingDown, Zap, BarChart3, RefreshCw } from 'lucide-react';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [a, o] = await Promise.all([api.orders.analytics(), api.orders.list()]);
      setAnalytics(a); setOrders(o);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  // Compute all-time totals from orders list
  const totalSavingsAll = orders.reduce((s, o) => s + (o.packaging_result?.savings ?? 0), 0);
  const optimizedCount = orders.filter(o => o.packaging_result).length;
  const avgEff = optimizedCount
    ? orders.reduce((s, o) => s + (o.packaging_result?.efficiency_score ?? 0), 0) / optimizedCount
    : 0;

  // Box breakdown table
  const boxDist = analytics?.box_usage_distribution ?? {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time savings & packaging performance metrics</p>
        </div>
        <button onClick={fetch} disabled={loading} className="flex items-center gap-2 px-4 py-2 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white text-sm rounded-xl transition-all disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Today stats */}
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Today</p>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatsCard title="Orders Today" value={analytics?.total_orders_today ?? 0} sub="processed" icon={Package} color="brand" loading={loading} />
          <StatsCard title="Savings Today" value={`₹${(analytics?.total_savings_today ?? 0).toFixed(2)}`} sub="vs default packaging" icon={TrendingDown} color="green" loading={loading} />
          <StatsCard title="Avg Savings/Order" value={`₹${(analytics?.avg_savings_per_order ?? 0).toFixed(2)}`} sub="today" icon={Zap} color="yellow" loading={loading} />
          <StatsCard title="Avg Efficiency" value={`${((analytics?.avg_efficiency_score ?? 0) * 100).toFixed(1)}%`} sub="today" icon={BarChart3} color="purple" loading={loading} />
        </div>
      </div>

      {/* All-time stats */}
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">All Time</p>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatsCard title="Total Orders" value={orders.length} sub="all time" icon={Package} color="brand" />
          <StatsCard title="Total Savings" value={`₹${totalSavingsAll.toFixed(2)}`} sub="all time" icon={TrendingDown} color="green" />
          <StatsCard title="Optimized" value={optimizedCount} sub="orders with results" icon={Zap} color="yellow" />
          <StatsCard title="Avg Efficiency" value={`${(avgEff * 100).toFixed(1)}%`} sub="all time" icon={BarChart3} color="purple" />
        </div>
      </div>

      {/* Charts */}
      <AnalyticsCharts analytics={analytics} />

      {/* Box breakdown table */}
      {Object.keys(boxDist).length > 0 && (
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Box Usage Breakdown</h3>
          <div className="space-y-2">
            {Object.entries(boxDist)
              .sort((a, b) => b[1] - a[1])
              .map(([box, count]) => {
                const total = Object.values(boxDist).reduce((s, v) => s + v, 0);
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={box} className="flex items-center gap-3">
                    <span className="text-sm text-slate-300 w-20">{box}</span>
                    <div className="flex-1 bg-slate-800 rounded-full h-2">
                      <div className="bg-brand-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-slate-500 w-16 text-right">{count} orders ({pct}%)</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
