'use client';
import { useState } from 'react';
import { Order } from '@/lib/api';
import { Box, ChevronDown, ChevronUp, Package2, Loader2, Info } from 'lucide-react';
import PackNowModal from './PackNowModal';
import clsx from 'clsx';

interface OrdersTableProps {
  orders: Order[];
  loading: boolean;
  onRefresh: () => void;
}

const STATUS_STYLES: Record<string, string> = {
  optimized:  'bg-green-500/10 text-green-400 border-green-500/20',
  processing: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  pending:    'bg-slate-700/50 text-slate-400 border-slate-600/20',
  packed:     'bg-brand-500/10 text-brand-400 border-brand-500/20',
};

export default function OrdersTable({ orders, loading, onRefresh }: OrdersTableProps) {
  const [packOrder, setPackOrder] = useState<Order | null>(null);
  const [sortKey, setSortKey] = useState<'id' | 'savings' | 'created_at'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const sorted = [...orders].sort((a, b) => {
    let av: number, bv: number;
    if (sortKey === 'id') { av = a.id; bv = b.id; }
    else if (sortKey === 'savings') { av = a.packaging_result?.savings ?? 0; bv = b.packaging_result?.savings ?? 0; }
    else { av = new Date(a.created_at).getTime(); bv = new Date(b.created_at).getTime(); }
    return sortDir === 'asc' ? av - bv : bv - av;
  });

  const toggleSort = (k: typeof sortKey) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('desc'); }
  };

  const SortIcon = ({ k }: { k: typeof sortKey }) =>
    sortKey === k
      ? (sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)
      : null;

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-12 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-12 text-center">
        <Package2 className="w-10 h-10 text-slate-700 mx-auto mb-3" />
        <p className="text-slate-400 font-medium">No orders yet</p>
        <p className="text-sm text-slate-600 mt-1">Upload a CSV or create an order to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
          <h3 className="font-semibold text-white text-sm">Orders & Optimization Results</h3>
          <span className="text-xs text-slate-500">{orders.length} orders</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                {[
                  { label: 'Order ID', k: 'id' as const },
                  { label: 'Product', k: null },
                  { label: 'Box', k: null },
                  { label: 'Baseline (₹)', k: null },
                  { label: 'Optimized (₹)', k: null },
                  { label: 'Savings (₹)', k: 'savings' as const },
                  { label: 'Status', k: null },
                  { label: 'Action', k: null },
                ].map(({ label, k }) => (
                  <th
                    key={label}
                    onClick={() => k && toggleSort(k)}
                    className={clsx(
                      'px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider',
                      k && 'cursor-pointer hover:text-slate-300 select-none'
                    )}
                  >
                    <span className="flex items-center gap-1">
                      {label}
                      {k && <SortIcon k={k} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((order) => {
                const pr = order.packaging_result;
                const savings = pr?.savings ?? 0;
                const isExpanded = expandedId === order.id;

                return (
                  <>
                    <tr
                      key={order.id}
                      className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-4 py-3.5 text-sm font-mono text-slate-400">#{order.id}</td>
                      <td className="px-4 py-3.5">
                        <div>
                          <p className="text-sm font-medium text-white">{order.product_name}</p>
                          <p className="text-xs text-slate-600">{order.length}×{order.width}×{order.height}cm · {order.weight}kg · ×{order.quantity}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {pr ? (
                          <div className="flex items-center gap-1.5">
                            <Box className="w-3.5 h-3.5 text-brand-400" />
                            <span className="text-sm text-white font-medium">{pr.recommended_box}</span>
                          </div>
                        ) : <span className="text-xs text-slate-600">Pending</span>}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-400">
                        {pr ? `₹${pr.baseline_cost.toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-brand-400 font-medium">
                        {pr ? `₹${pr.optimized_cost.toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        {pr ? (
                          <span className={clsx(
                            'text-sm font-bold',
                            savings > 0 ? 'text-green-400' : savings < 0 ? 'text-red-400' : 'text-slate-500'
                          )}>
                            {savings > 0 ? '+' : ''}₹{savings.toFixed(2)}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={clsx(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                          STATUS_STYLES[order.status] ?? STATUS_STYLES.pending
                        )}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          {pr && (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : order.id)}
                              title="View explanation"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 transition-all"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {pr && order.status !== 'packed' && (
                            <button
                              onClick={() => setPackOrder(order)}
                              className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium rounded-lg transition-all flex items-center gap-1.5"
                            >
                              <Box className="w-3 h-3" /> Pack Now
                            </button>
                          )}
                          {order.status === 'packed' && (
                            <span className="text-xs text-green-400">✓ Packed</span>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && pr && (
                      <tr key={`${order.id}-exp`} className="bg-slate-800/30 border-b border-slate-800/50">
                        <td colSpan={8} className="px-6 py-3">
                          <p className="text-xs text-slate-400 leading-relaxed">{pr.decision_explanation}</p>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {packOrder && (
        <PackNowModal
          order={packOrder}
          onClose={() => setPackOrder(null)}
          onPacked={onRefresh}
        />
      )}
    </>
  );
}
