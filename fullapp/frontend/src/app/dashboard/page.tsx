'use client';
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '@/lib/api';

interface Stat {
  date: string;
  total: number;
  success: number;
  errors: number;
}

interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export default function DashboardPage() {
  const [user, setUser]           = useState<User | null>(null);
  const [stats, setStats]         = useState<Stat[]>([]);
  const [todayCount, setToday]    = useState(0);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/auth/me'),
      api.get('/usage/stats'),
    ]).then(([meRes, usageRes]) => {
      setUser(meRes.data.user);
      setStats(usageRes.data.stats);
      setToday(usageRes.data.todayCount);
    }).finally(() => setLoading(false));
  }, []);

  const totalRequests = stats.reduce((s, d) => s + d.total, 0);
  const totalErrors   = stats.reduce((s, d) => s + d.errors, 0);
  const limit         = user?.role === 'PRO' ? 2000 : 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">{user?.email} · <span className={`font-medium ${user?.role === 'PRO' ? 'text-indigo-400' : 'text-gray-400'}`}>{user?.role}</span></p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Requests today', value: todayCount, sub: `${limit - todayCount} remaining` },
          { label: 'Total (30 days)', value: totalRequests, sub: 'All endpoints' },
          { label: 'Error rate', value: totalRequests > 0 ? `${((totalErrors / totalRequests) * 100).toFixed(1)}%` : '0%', sub: `${totalErrors} errors` },
        ].map((c) => (
          <div key={c.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-2">{c.label}</div>
            <div className="text-3xl font-bold mb-1">{c.value}</div>
            <div className="text-gray-500 text-xs">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Rate limit bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-8">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium">Daily usage</span>
          <span className="text-xs text-gray-500">{todayCount} / {limit} requests</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${todayCount / limit > 0.8 ? 'bg-red-500' : 'bg-indigo-500'}`}
            style={{ width: `${Math.min((todayCount / limit) * 100, 100)}%` }}
          />
        </div>
        {user?.role === 'FREE' && (
          <p className="text-xs text-gray-500 mt-2">Upgrade to Pro for 2,000 requests/day</p>
        )}
      </div>

      {/* Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-medium mb-5">Requests — last 30 days</h2>
        {stats.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-600 text-sm">
            No requests yet. Start using the API!
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} dot={false} name="Total" />
              <Line type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} dot={false} name="Errors" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
