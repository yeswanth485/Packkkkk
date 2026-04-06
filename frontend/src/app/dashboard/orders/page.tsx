'use client';
import { useState, useEffect, useCallback } from 'react';
import { api, Order } from '@/lib/api';
import OrdersTable from '@/components/dashboard/OrdersTable';
import { Plus, Loader2 } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ product_name:'', length:'', width:'', height:'', weight:'', quantity:'1' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchOrders = useCallback(async () => {
    try { setOrders(await api.orders.list()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const createOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      await api.orders.create({
        product_name: form.product_name,
        length: parseFloat(form.length),
        width: parseFloat(form.width),
        height: parseFloat(form.height),
        weight: parseFloat(form.weight),
        quantity: parseInt(form.quantity),
      });
      setShowForm(false);
      setForm({ product_name:'', length:'', width:'', height:'', weight:'', quantity:'1' });
      await fetchOrders();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create order');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">All orders with packaging optimization results</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-xl transition-all"
        >
          <Plus className="w-4 h-4" /> New Order
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5 animate-slide-up">
          <h3 className="text-sm font-semibold text-white mb-4">Create Single Order</h3>
          <form onSubmit={createOrder}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-3">
                <label className="text-xs text-slate-400 mb-1 block">Product Name</label>
                <input
                  required value={form.product_name}
                  onChange={e => setForm(f => ({...f, product_name: e.target.value}))}
                  placeholder="e.g. Wireless Headphones"
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
              {['length','width','height','weight','quantity'].map(field => (
                <div key={field}>
                  <label className="text-xs text-slate-400 mb-1 block capitalize">
                    {field}{field !== 'quantity' ? (field === 'weight' ? ' (kg)' : ' (cm)') : ''}
                  </label>
                  <input
                    required type="number" min={field === 'quantity' ? 1 : 0.1} step="0.01"
                    value={form[field as keyof typeof form]}
                    onChange={e => setForm(f => ({...f, [field]: e.target.value}))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              ))}
            </div>
            {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-700 text-slate-400 text-sm rounded-xl hover:text-white transition-colors">Cancel</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-xl transition-all flex items-center gap-2 disabled:opacity-60">
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Create & Optimize
              </button>
            </div>
          </form>
        </div>
      )}

      <OrdersTable orders={orders} loading={loading} onRefresh={fetchOrders} />
    </div>
  );
}
