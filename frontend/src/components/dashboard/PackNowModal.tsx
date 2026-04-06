'use client';
import { X, Box, Package, CheckCircle2, Info, ArrowRight } from 'lucide-react';
import { Order } from '@/lib/api';

interface PackNowModalProps {
  order: Order;
  onClose: () => void;
  onPacked: () => void;
}

const BOX_DIMS: Record<string, string> = {
  Box_XS:  '15×12×10 cm', Box_S: '25×20×15 cm', Box_M: '35×30×25 cm',
  Box_L:   '50×40×35 cm', Box_XL: '65×55×45 cm', Box_XXL: '80×70×60 cm',
};

const PACKING_TIPS: Record<string, string> = {
  Box_XS:  'Small item — wrap securely. Use bubble wrap if fragile.',
  Box_S:   'Place item centered. Fill gaps with paper padding.',
  Box_M:   'Heavier items at bottom. Add cushioning on all sides.',
  Box_L:   'Distribute weight evenly. Seal edges with extra tape.',
  Box_XL:  'Use dividers for multiple items. Fragile items on top.',
  Box_XXL: 'Large shipment — double-wall box. Verify seal strength.',
};

export default function PackNowModal({ order, onClose, onPacked }: PackNowModalProps) {
  const pr = order.packaging_result;
  if (!pr) return null;

  const savings = pr.savings ?? 0;
  let alternatives: Array<{ box_type: string; dimensions: string; cost: number; efficiency: number }> = [];
  try { alternatives = JSON.parse(pr.alternative_boxes || '[]'); } catch {}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500/15 flex items-center justify-center">
              <Box className="w-4.5 h-4.5 text-brand-400" style={{ width: '1.1rem', height: '1.1rem' }} />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">Pack Now</h2>
              <p className="text-xs text-slate-500">Order #{order.id} · {order.product_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Recommended box - big */}
          <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-4 text-center">
            <p className="text-xs text-slate-400 mb-1">Recommended Box</p>
            <p className="text-3xl font-bold text-brand-400 mb-1">{pr.recommended_box}</p>
            <p className="text-sm text-slate-400">{BOX_DIMS[pr.recommended_box] ?? pr.box_dimensions}</p>
            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-500">
              <span>Efficiency: <span className="text-white">{(pr.efficiency_score * 100).toFixed(0)}%</span></span>
              <span>Confidence: <span className="text-white">{(pr.confidence_score * 100).toFixed(0)}%</span></span>
            </div>
          </div>

          {/* Items to pack */}
          <div className="bg-slate-800/60 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" /> Items in this box
            </p>
            <div className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
              <div>
                <p className="text-sm font-medium text-white">{order.product_name}</p>
                <p className="text-xs text-slate-500">{order.length}×{order.width}×{order.height} cm · {order.weight} kg</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-white">×{order.quantity}</p>
                <p className="text-xs text-slate-500">units</p>
              </div>
            </div>
          </div>

          {/* Packing instruction */}
          <div className="flex gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <Info className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-200/80 leading-relaxed">
              {PACKING_TIPS[pr.recommended_box] ?? 'Place heavier items at bottom, fragile items on top.'}
            </p>
          </div>

          {/* Cost breakdown */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-800 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">Baseline</p>
              <p className="text-sm font-bold text-slate-300">₹{pr.baseline_cost.toFixed(2)}</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">Optimized</p>
              <p className="text-sm font-bold text-brand-400">₹{pr.optimized_cost.toFixed(2)}</p>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
              <p className="text-xs text-green-400 mb-1">Savings</p>
              <p className={`text-sm font-bold ${savings >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ₹{savings.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Alternatives */}
          {alternatives.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Alternative Options</p>
              <div className="space-y-1.5">
                {alternatives.map((alt) => (
                  <div key={alt.box_type} className="flex items-center justify-between px-3 py-2 bg-slate-800/60 rounded-lg">
                    <div>
                      <span className="text-xs font-medium text-slate-300">{alt.box_type}</span>
                      <span className="text-xs text-slate-600 ml-2">{alt.dimensions}</span>
                    </div>
                    <span className="text-xs text-slate-400">₹{alt.cost.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-700/50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-700 text-slate-400 hover:text-white text-sm rounded-xl transition-colors">
            Cancel
          </button>
          <button
            onClick={() => { onPacked(); onClose(); }}
            className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> Mark as Packed
          </button>
        </div>
      </div>
    </div>
  );
}
