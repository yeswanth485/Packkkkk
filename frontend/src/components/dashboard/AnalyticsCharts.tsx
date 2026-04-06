'use client';
import { useEffect, useRef } from 'react';
import { Analytics } from '@/lib/api';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
);

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e293b',
      borderColor: '#334155',
      borderWidth: 1,
      titleColor: '#94a3b8',
      bodyColor: '#f1f5f9',
      padding: 10,
    },
  },
};

const GRID = {
  color: 'rgba(51,65,85,0.5)',
  drawBorder: false,
};

export default function AnalyticsCharts({ analytics }: { analytics: Analytics | null }) {
  if (!analytics) return (
    <div className="grid md:grid-cols-2 gap-5">
      {[1,2,3].map(i => <div key={i} className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5 h-64 skeleton" />)}
    </div>
  );

  const savingsTrend = analytics.savings_trend ?? [];
  const boxDist = analytics.box_usage_distribution ?? {};

  // Savings trend line chart
  const lineData = {
    labels: savingsTrend.map(d => d.date),
    datasets: [{
      label: 'Savings (₹)',
      data: savingsTrend.map(d => d.savings),
      borderColor: '#0ea5e9',
      backgroundColor: 'rgba(14,165,233,0.08)',
      borderWidth: 2,
      pointBackgroundColor: '#0ea5e9',
      pointRadius: 4,
      fill: true,
      tension: 0.4,
    }],
  };

  // Box usage doughnut
  const boxColors = ['#0ea5e9','#38bdf8','#7dd3fc','#bae6fd','#0369a1','#0c4a6e'];
  const doughnutData = {
    labels: Object.keys(boxDist),
    datasets: [{
      data: Object.values(boxDist),
      backgroundColor: boxColors,
      borderColor: '#0f172a',
      borderWidth: 2,
    }],
  };

  // Savings bar per day
  const barData = {
    labels: savingsTrend.map(d => d.date),
    datasets: [{
      label: '₹ Saved',
      data: savingsTrend.map(d => d.savings),
      backgroundColor: savingsTrend.map(d => d.savings > 0 ? 'rgba(34,197,94,0.7)' : 'rgba(239,68,68,0.5)'),
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
      {/* Savings Trend */}
      <div className="md:col-span-2 bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
        <h4 className="text-sm font-semibold text-white mb-4">Savings Trend — Last 7 Days</h4>
        <div className="h-52">
          <Line
            data={lineData}
            options={{
              ...CHART_DEFAULTS,
              plugins: { ...CHART_DEFAULTS.plugins, legend: { display: false } },
              scales: {
                x: { grid: GRID, ticks: { color: '#64748b', font: { size: 11 } } },
                y: {
                  grid: GRID,
                  ticks: { color: '#64748b', font: { size: 11 }, callback: v => `₹${v}` },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Box Distribution */}
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
        <h4 className="text-sm font-semibold text-white mb-4">Box Usage Distribution</h4>
        {Object.keys(boxDist).length === 0 ? (
          <div className="h-52 flex items-center justify-center text-slate-600 text-sm">No data yet</div>
        ) : (
          <>
            <div className="h-40">
              <Doughnut
                data={doughnutData}
                options={{
                  ...CHART_DEFAULTS,
                  cutout: '65%',
                  plugins: {
                    ...CHART_DEFAULTS.plugins,
                    legend: { display: true, position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 }, padding: 8 } },
                  },
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Daily Savings Bar */}
      <div className="md:col-span-2 xl:col-span-3 bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
        <h4 className="text-sm font-semibold text-white mb-4">Daily Savings (₹) — Last 7 Days</h4>
        <div className="h-44">
          <Bar
            data={barData}
            options={{
              ...CHART_DEFAULTS,
              scales: {
                x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 11 } } },
                y: {
                  grid: GRID,
                  ticks: { color: '#64748b', font: { size: 11 }, callback: v => `₹${v}` },
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
