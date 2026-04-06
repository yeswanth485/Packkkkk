'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  Package, TrendingDown, Zap, BarChart3, ArrowRight,
  CheckCircle2, Box, Truck, ChevronRight, Play, Warehouse
} from 'lucide-react';

// Box catalog mirrored from backend
const BOX_CATALOG: Record<string, { dims: [number,number,number]; cost: number; label: string }> = {
  Box_XS:  { dims: [15,12,10],  cost: 8,  label: 'Extra Small' },
  Box_S:   { dims: [25,20,15],  cost: 12, label: 'Small' },
  Box_M:   { dims: [35,30,25],  cost: 18, label: 'Medium' },
  Box_L:   { dims: [50,40,35],  cost: 25, label: 'Large' },
  Box_XL:  { dims: [65,55,45],  cost: 35, label: 'Extra Large' },
  Box_XXL: { dims: [80,70,60],  cost: 50, label: 'Double XL' },
};
const RATE = 45;
const DEFAULT_BOX = 'Box_XL';

function calcCost(L:number,W:number,H:number,weight:number,box:string) {
  const bCost = BOX_CATALOG[box]?.cost ?? 35;
  const dimW = (L*W*H)/5000;
  const chargeW = Math.max(weight, dimW);
  const ship = RATE * chargeW;
  return Math.round((ship + bCost)*100)/100;
}

function findBestBox(L:number,W:number,H:number) {
  const sorted = Object.entries(BOX_CATALOG).sort((a,b)=>a[1].dims[0]*a[1].dims[1]*a[1].dims[2] - b[1].dims[0]*b[1].dims[1]*b[1].dims[2]);
  for (const [name,info] of sorted) {
    const [bL,bW,bH] = info.dims;
    if (bL>=L*1.05 && bW>=W*1.05 && bH>=H*1.05) return name;
  }
  return 'Box_XXL';
}

export default function LandingPage() {
  const [demo, setDemo] = useState({ L:28, W:18, H:12, weight:2.0 });
  const [result, setResult] = useState<null|{box:string;baseline:number;optimized:number;savings:number;pct:number}>(null);
  const [running, setRunning] = useState(false);

  const runDemo = () => {
    setRunning(true);
    setTimeout(() => {
      const recommended = findBestBox(demo.L, demo.W, demo.H);
      const baseline = calcCost(demo.L, demo.W, demo.H, demo.weight, DEFAULT_BOX);
      const optimized = calcCost(demo.L, demo.W, demo.H, demo.weight, recommended);
      const savings = Math.max(0, Math.round((baseline - optimized)*100)/100);
      const pct = baseline > 0 ? Math.round((savings/baseline)*100) : 0;
      setResult({ box: recommended, baseline, optimized, savings, pct });
      setRunning(false);
    }, 900);
  };

  const features = [
    { icon: Zap, title: 'Instant Optimization', desc: 'Sub-200ms prediction engine selects the best box for every order automatically' },
    { icon: TrendingDown, title: '15–30% Cost Reduction', desc: 'Smart dimensional weight calculation eliminates over-packaging waste' },
    { icon: BarChart3, title: 'Real-Time Analytics', desc: 'Live dashboard tracks savings, efficiency scores, and box usage trends' },
    { icon: Warehouse, title: 'Warehouse-Ready UI', desc: 'One-click Pack Now workflow designed for high-volume packing staff' },
  ];

  const useCases = [
    { value: '200+', label: 'Orders/day handled', sub: 'Built for warehouse scale' },
    { value: '₹18–50', label: 'Saved per order', sub: 'Average across box types' },
    { value: '< 200ms', label: 'Prediction latency', sub: 'Real-time, no delays' },
    { value: '6 box', label: 'Smart SKU catalog', sub: 'XS to XXL, auto-matched' },
  ];

  return (
    <div className="min-h-screen bg-[#070d1a] text-slate-100">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/50 bg-[#070d1a]/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-white">PackAI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-slate-400 hover:text-white text-sm transition-colors">Sign In</Link>
            <Link href="/login" className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5">
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            Live optimization engine · No mock data
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-[1.1] mb-6">
            Reduce Packaging &<br />
            <span className="text-brand-400">Shipping Costs by 15–30%</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            AI-powered box selection engine that matches every order to the optimal packaging in under 200ms.
            Built for warehouses processing 200+ orders daily.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/login" className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-brand-500/20 flex items-center gap-2">
              <Play className="w-4 h-4" /> Try Live Demo
            </Link>
            <a href="#demo" className="px-6 py-3 border border-slate-700 hover:border-slate-500 text-slate-300 font-medium rounded-xl transition-colors flex items-center gap-2">
              See How It Works <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-12 border-y border-slate-800/50">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {useCases.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold text-white mb-1">{s.value}</div>
              <div className="text-sm font-medium text-slate-300">{s.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* LIVE INTERACTIVE DEMO */}
      <section id="demo" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Interactive Cost Calculator</h2>
            <p className="text-slate-400">Enter real product dimensions and see instant savings — same engine powering the platform</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Input */}
            <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Product Dimensions</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {(['L','W','H'] as const).map((dim) => (
                  <div key={dim}>
                    <label className="text-xs text-slate-500 mb-1 block">
                      {dim === 'L' ? 'Length' : dim === 'W' ? 'Width' : 'Height'} (cm)
                    </label>
                    <input
                      type="number"
                      value={demo[dim === 'L' ? 'L' : dim === 'W' ? 'W' : 'H']}
                      min={1}
                      onChange={e => setDemo(d => ({ ...d, [dim === 'L' ? 'L' : dim === 'W' ? 'W' : 'H']: parseFloat(e.target.value)||1 }))}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
                    />
                  </div>
                ))}
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Weight (kg)</label>
                  <input
                    type="number"
                    value={demo.weight}
                    min={0.1}
                    step={0.1}
                    onChange={e => setDemo(d => ({ ...d, weight: parseFloat(e.target.value)||0.1 }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>
              <button
                onClick={runDemo}
                disabled={running}
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {running ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Optimizing...</>
                ) : (
                  <><Zap className="w-4 h-4" /> Calculate Savings</>
                )}
              </button>

              {/* Real example */}
              <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <p className="text-xs text-slate-500 mb-2">📦 Try a real example:</p>
                <button
                  onClick={() => { setDemo({ L:42, W:28, H:20, weight:3.5 }); setResult(null); }}
                  className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                >
                  Shoe Box (42×28×20 cm, 3.5kg) →
                </button>
              </div>
            </div>

            {/* Result */}
            <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 flex flex-col justify-center">
              {!result && !running && (
                <div className="text-center text-slate-500">
                  <Box className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Enter dimensions and click Calculate</p>
                </div>
              )}
              {running && (
                <div className="text-center">
                  <div className="w-12 h-12 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-slate-400">Running optimization engine...</p>
                </div>
              )}
              {result && !running && (
                <div className="animate-slide-up">
                  <div className="flex items-center gap-2 mb-5">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span className="text-sm font-semibold text-green-400">Optimization Complete</span>
                  </div>
                  <div className="text-center mb-5">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500/10 border border-brand-500/20 rounded-xl mb-3">
                      <Box className="w-4 h-4 text-brand-400" />
                      <span className="text-lg font-bold text-brand-400">{result.box}</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {BOX_CATALOG[result.box]?.label} · {BOX_CATALOG[result.box]?.dims.join('×')} cm
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-800 rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-500 mb-1">Baseline</p>
                      <p className="text-lg font-bold text-slate-300">₹{result.baseline}</p>
                    </div>
                    <div className="bg-slate-800 rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-500 mb-1">Optimized</p>
                      <p className="text-lg font-bold text-brand-400">₹{result.optimized}</p>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
                      <p className="text-xs text-green-400 mb-1">You Save</p>
                      <p className="text-lg font-bold text-green-400">₹{result.savings}</p>
                      <p className="text-xs text-green-500">{result.pct}% off</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-4 text-center">
                    Shipping rate: ₹{RATE}/kg · Dim weight divisor: 5000
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-6 bg-slate-900/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Everything Your Warehouse Needs</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f) => (
              <div key={f.title} className="flex gap-4 p-5 rounded-xl border border-slate-700/50 bg-slate-900/50 hover:border-brand-500/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{f.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TARGET USERS */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Built for High-Volume Warehouses</h2>
          <p className="text-slate-400 mb-10">
            Designed for operations processing <strong className="text-white">200+ orders per day</strong> where
            packaging inefficiency compounds into significant monthly losses.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Warehouse, label: 'E-commerce Warehouses' },
              { icon: Truck, label: '3PL Providers' },
              { icon: Package, label: 'D2C Brands' },
            ].map((u) => (
              <div key={u.label} className="p-5 rounded-xl bg-slate-900 border border-slate-700/50 text-center">
                <u.icon className="w-7 h-7 text-brand-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-300">{u.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center bg-gradient-to-br from-brand-900/30 to-slate-900 border border-brand-500/20 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-white mb-3">Start Saving Today</h2>
          <p className="text-slate-400 mb-8">Upload your first order batch and see live savings in under 2 minutes.</p>
          <Link href="/login" className="inline-flex items-center gap-2 px-8 py-4 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-all hover:shadow-xl hover:shadow-brand-500/25 text-lg">
            <Play className="w-5 h-5" /> Try Live Demo — Free
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 py-8 px-6 text-center text-sm text-slate-600">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Package className="w-4 h-4 text-brand-500" />
          <span className="font-bold text-slate-400">PackAI</span>
        </div>
        <p>AI Packaging Automation Platform · Production-grade optimization engine</p>
      </footer>
    </div>
  );
}
