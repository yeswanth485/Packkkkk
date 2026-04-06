'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Package, LayoutDashboard, ShoppingCart,
  BarChart3, LogOut, Wifi, WifiOff,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import clsx from 'clsx';

const nav = [
  { href: '/dashboard',         icon: LayoutDashboard, label: 'Overview'  },
  { href: '/dashboard/orders',  icon: ShoppingCart,    label: 'Orders'    },
  { href: '/dashboard/analytics',icon: BarChart3,      label: 'Analytics' },
];

export default function Sidebar({ wsConnected = false }: { wsConnected?: boolean }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => { logout(); router.push('/login'); };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900 border-r border-slate-700/50 flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <Package className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-sm">PackAI</div>
            <div className="text-xs text-slate-500">Packaging Platform</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* WS Status */}
      <div className="px-4 py-3 border-t border-slate-700/50">
        <div className={clsx(
          'flex items-center gap-2 text-xs px-3 py-2 rounded-lg',
          wsConnected ? 'text-green-400 bg-green-500/10' : 'text-slate-500 bg-slate-800'
        )}>
          {wsConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {wsConnected ? 'Live updates active' : 'Connecting...'}
        </div>
      </div>

      {/* User */}
      <div className="px-3 py-3 border-t border-slate-700/50">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-sm font-bold">
            {user?.email?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-white truncate">{user?.full_name || 'User'}</div>
            <div className="text-xs text-slate-500 truncate">{user?.email}</div>
          </div>
          <button onClick={handleLogout} title="Sign out" className="text-slate-600 hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
