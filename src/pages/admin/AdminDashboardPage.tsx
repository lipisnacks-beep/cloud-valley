import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Plus, CalendarDays, Mail } from 'lucide-react';
import { api } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { formatCurrency, formatDateShort } from '../../lib/utils';

const STATUS_COLORS: Record<string, string> = {
  Pending: '#D97706',
  Confirmed: '#234638',
  Completed: '#0F766E',
  Cancelled: '#DC2626',
  Rejected: '#64748B',
};

export function AdminDashboardPage() {
  const [range, setRange] = useState<'week' | 'month' | '3months' | 'year'>('year');

  const analyticsQuery = useQuery({
    queryKey: ['admin', 'analytics', range],
    queryFn: () => api.getAnalytics(range),
  });

  const data = analyticsQuery.data;

  return (
    <div className="space-y-6">
      {/* Header & Range Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-slate-900">
            Resort Operations Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Live reservation pipeline, occupancy trends, and daily arrivals at Samalbong.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-1 bg-white rounded-md border border-slate-200">
            {[
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' },
              { id: '3months', label: '3 Months' },
              { id: 'year', label: 'This Year' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRange(item.id as typeof range)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                  range === item.id
                    ? 'bg-[#234638] text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Action Bar */}
      <div className="flex flex-wrap gap-3">
        <Button asChild size="sm">
          <Link to="/admin/bookings" className="inline-flex items-center gap-1.5">
            <span>Review Bookings</span>
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="bg-white">
          <Link to="/admin/rooms/create" className="inline-flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span>Add Room Category</span>
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="bg-white">
          <Link to="/admin/availability" className="inline-flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Manage Availability</span>
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="bg-white">
          <Link to="/admin/messages" className="inline-flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            <span>Unread Messages ({data?.kpis.unreadMessages ?? 0})</span>
          </Link>
        </Button>
      </div>

      {/* KPI Cards */}
      {analyticsQuery.isLoading || !data ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {Array.from({ length: 7 }).map((_, idx) => (
            <Skeleton key={idx} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          {[
            { label: 'Total Bookings', value: data.kpis.totalBookings, tone: 'text-slate-900' },
            { label: 'Pending', value: data.kpis.pendingBookings, tone: 'text-amber-700' },
            { label: 'Confirmed', value: data.kpis.confirmedBookings, tone: 'text-[#234638]' },
            { label: 'Cancelled', value: data.kpis.cancelledBookings, tone: 'text-red-700' },
            { label: "Today's Arrivals", value: data.kpis.todayArrivals, tone: 'text-slate-900' },
            { label: "Today's Departures", value: data.kpis.todayDepartures, tone: 'text-slate-900' },
            { label: 'Room Categories', value: data.kpis.totalRoomCategories, tone: 'text-slate-900' },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col justify-between"
            >
              <span className="text-xs text-slate-500">{kpi.label}</span>
              <span className={`text-2xl font-mono font-semibold mt-2 tabular-nums ${kpi.tone}`}>
                {kpi.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white rounded-lg border border-slate-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">Monthly Booking Requests</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="requests" name="Requests" fill="#C6A66B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="confirmed" name="Confirmed" fill="#234638" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-3 bg-white rounded-lg border border-slate-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">Status Distribution</h2>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.statusDistribution.filter((s) => s.count > 0)}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={42}
                    outerRadius={72}
                    paddingAngle={2}
                  >
                    {data.statusDistribution
                      .filter((s) => s.count > 0)
                      .map((entry) => (
                        <Cell
                          key={entry.status}
                          fill={STATUS_COLORS[entry.status] || '#234638'}
                        />
                      ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 text-xs">
              {data.statusDistribution.map((s) => (
                <div key={s.status} className="flex items-center justify-between">
                  <span className="text-slate-600">{s.status}</span>
                  <span className="font-mono font-medium tabular-nums">{s.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 bg-white rounded-lg border border-slate-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">Room Category Demand</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.roomDemand} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="roomName"
                    width={130}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip />
                  <Bar dataKey="bookings" name="Bookings" fill="#234638" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Recent Bookings Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Recent Booking Requests</h2>
          <Link to="/admin/bookings" className="text-xs font-medium text-[#234638] hover:underline">
            View All Bookings
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-medium">Reference</th>
                <th className="py-3 px-4 font-medium">Guest</th>
                <th className="py-3 px-4 font-medium">Room</th>
                <th className="py-3 px-4 font-medium">Check-in</th>
                <th className="py-3 px-4 font-medium">Check-out</th>
                <th className="py-3 px-4 font-medium text-right">Est. Tariff</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data?.recentBookings || []).map((b) => (
                <tr key={b._id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono font-medium text-slate-900">
                    {b.bookingReference}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-900">{b.guestName}</p>
                    <p className="text-slate-500">{b.phone}</p>
                  </td>
                  <td className="py-3 px-4 text-slate-700">{b.roomName}</td>
                  <td className="py-3 px-4 tabular-nums text-slate-600">
                    {formatDateShort(b.checkIn)}
                  </td>
                  <td className="py-3 px-4 tabular-nums text-slate-600">
                    {formatDateShort(b.checkOut)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900">
                    {formatCurrency(b.estimatedPrice)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className="inline-block px-2 py-0.5 rounded text-[11px] font-medium"
                      style={{
                        backgroundColor: `${STATUS_COLORS[b.status] || '#64748B'}18`,
                        color: STATUS_COLORS[b.status] || '#334155',
                      }}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/admin/bookings/${b._id}`}
                      className="text-[#234638] font-medium hover:underline"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
              {data && data.recentBookings.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No bookings recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
