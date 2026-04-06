'use client';
import { useState, useEffect, useCallback } from 'react';
import { Package, TrendingDown, Zap, BarChart3, RefreshCw } from 'lucide-react';
import { api, Order, Analytics } from '@/lib/api';
import StatsCard from '@/components/dashboard/StatsCard';
import CSVUpload from '@/components/dashboard/CSVUpload';
import OrdersTable from '@/components/dashboard/OrdersTable';
import AnalyticsCharts from '@/components/dashboard/AnalyticsCharts';
import { useWebSocket } from '@/lib/useWebSocket';
import { useAuth } from '@/lib/auth';
import Sidebar from '@/components/dashboard/Sidebar';

export default function DashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await api.orders.list();
      setOrders(data);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Failed to fetch orders:', e);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const data = await api.orders.analytics();
      setAnalytics(data);
    } catch (e) {
      console.error('Failed to fetch analytics:', e);
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoadingOrders(true);
    await Promise.all([fetchOrders(), fetchAnalytics()]);
  }, [fetchOrders, fetchAnalytics]);

  // Initial load
  useEffect(() => { refresh(); }, [refresh]);

  // WebSocket real-time updates
  const { connected } = useWebSocket(useCallback((msg) => {
    if (msg.type === 'connected') setWsConnected(true);
    if (msg.type === 'order_optimized') {
      setToast(`Order #${msg.order_id} optimized → ${msg.recommended_box} · Saves ₹${msg.savings}`);
      setTimeout(() => setToast(null), 4000);
      refresh();
    }
    if (msg.type === 'pong') setWsConnected(true);
  }, [refresh]));

  // Polling fallback every 10s
  useEffect(() => {
    const t = setInterval(refresh, 10000);
    return () => clearInterval(t);
  }, [refresh]);

  const totalSavingsAll = orders.reduce((s, o) => s + (o.packaging_result?.savings ?? 0), 0);
  const avgEfficiency = orders.length
    ? orders.reduce((s, o) => s + (o.packaging_result?.efficiency_score ?? 0), 0) / orders.filter(o => o.packaging_result).length
    : 0;

  return (
    <div className="min-h-screen bg-[#070d1a] flex">
      <Sidebar wsConnected={wsConnected || connected} />
      <main className="flex-1 ml-64 min-h-screen overflow-auto">
        <div className="p-6 max-w-7xl mx-auto space-y-6">

          {/* Toast */}
          {toast && (
            <div className="fixed top-5 right-5 z-50 px-4 py-3 bg-green-500/90 text-white text-sm font-medium rounded-xl shadow-xl animate-slide-up flex items-center gap-2">
              <Zap className="w-4 h-4" /> {toast}
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
              </p>
            </div>
            <button
              onClick={refresh}
              disabled={loadingOrders}
              className="flex items-center gap-2 px-4 py-2 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white text-sm rounded-xl transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatsCard
              title="Orders Today"
              value={analytics?.total_orders_today ?? orders.length}
              sub="from CSV uploads & API"
              icon={Package}
              color="brand"
              loading={loadingAnalytics}
            />
            <StatsCard
              title="Total Savings Today"
              value={`₹${(analytics?.total_savings_today ?? 0).toFixed(2)}`}
              sub="vs default packaging"
              icon={TrendingDown}
              color="green"
              loading={loadingAnalytics}
            />
            <StatsCard
              title="Avg Savings / Order"
              value={`₹${(analytics?.avg_savings_per_order ?? 0).toFixed(2)}`}
              sub="per optimized order"
              icon={Zap}
              color="yellow"
              loading={loadingAnalytics}
            />
            <StatsCard
              title="Avg Efficiency"
              value={`${((analytics?.avg_efficiency_score ?? avgEfficiency) * 100).toFixed(1)}%`}
              sub="product-to-box fit ratio"
              icon={BarChart3}
              color="purple"
              loading={loadingAnalytics}
            />
          </div>

          {/* Upload + Charts row */}
          <div className="grid lg:grid-cols-3 gap-5">
            <div className="lg:col-span-1">
              <CSVUpload onSuccess={refresh} />
            </div>
            <div className="lg:col-span-2">
              <AnalyticsCharts analytics={analytics} />
            </div>
          </div>

          {/* Orders table */}
          <OrdersTable orders={orders} loading={loadingOrders} onRefresh={refresh} />
        </div>
      </main>
    </div>
  );
}
