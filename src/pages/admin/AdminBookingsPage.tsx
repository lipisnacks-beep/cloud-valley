import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Download, Search } from 'lucide-react';
import { api } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { SelectField } from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';
import { BOOKING_STATUSES } from '../../../shared/constants/index.ts';
import { formatCurrency, formatDateShort } from '../../lib/utils';

const STATUS_BADGE: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-800',
  Confirmed: 'bg-emerald-100 text-emerald-800',
  Completed: 'bg-teal-100 text-teal-800',
  Cancelled: 'bg-red-100 text-red-800',
  Rejected: 'bg-slate-200 text-slate-700',
};

export function AdminBookingsPage() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState('All');
  const [roomId, setRoomId] = useState('All');
  const [checkIn, setCheckIn] = useState('');
  const [page, setPage] = useState(1);

  const roomsQuery = useQuery({
    queryKey: ['admin', 'rooms'],
    queryFn: api.getAdminRooms,
  });

  const bookingsQuery = useQuery({
    queryKey: ['admin', 'bookings', { search, status, roomId, checkIn, page }],
    queryFn: () =>
      api.getAdminBookings({
        search: search || undefined,
        status: status === 'All' ? undefined : status,
        roomId: roomId === 'All' ? undefined : roomId,
        checkIn: checkIn || undefined,
        page,
        limit: 20,
      }),
  });

  const bookings = bookingsQuery.data?.data || [];
  const meta = bookingsQuery.data?.meta;

  const handleExportCsv = () => {
    const headers = [
      'Reference',
      'Guest Name',
      'Phone',
      'Email',
      'Room',
      'Units',
      'Check-In',
      'Check-Out',
      'Adults',
      'Children',
      'Estimated Tariff',
      'Status',
      'Created At',
    ];
    const rows = bookings.map((b) => [
      b.bookingReference,
      `"${b.guestName.replace(/"/g, '""')}"`,
      `"${b.phone}"`,
      b.email,
      `"${b.roomName}"`,
      b.roomsRequested,
      b.checkIn.slice(0, 10),
      b.checkOut.slice(0, 10),
      b.adults,
      b.children,
      b.estimatedPrice,
      b.status,
      b.createdAt.slice(0, 10),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cloud-valley-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900">
            Booking Management
          </h1>
          <p className="text-xs text-slate-500">
            Search, filter, confirm, or export guest reservation requests.
          </p>
        </div>
        <Button variant="outline" size="sm" className="bg-white" onClick={handleExportCsv}>
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search ref, name, phone..."
            className="pl-9"
          />
        </div>

        <SelectField
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="All">All Statuses</option>
          {BOOKING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </SelectField>

        <SelectField
          value={roomId}
          onChange={(e) => {
            setRoomId(e.target.value);
            setPage(1);
          }}
        >
          <option value="All">All Rooms</option>
          {(roomsQuery.data || []).map((r) => (
            <option key={r._id} value={r._id}>
              {r.name}
            </option>
          ))}
        </SelectField>

        <Input
          type="date"
          value={checkIn}
          onChange={(e) => {
            setCheckIn(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by check-in date"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {bookingsQuery.isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <Skeleton key={n} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-medium">Reference</th>
                  <th className="py-3 px-4 font-medium">Guest</th>
                  <th className="py-3 px-4 font-medium">Room</th>
                  <th className="py-3 px-4 font-medium">Stay Dates</th>
                  <th className="py-3 px-4 font-medium">Guests</th>
                  <th className="py-3 px-4 font-medium text-right">Est. Tariff</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      {b.bookingReference}
                      {b.cancellationRequested && (
                        <span className="block text-[10px] text-red-700 font-sans mt-0.5">
                          Cancel requested
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-900">{b.guestName}</p>
                      <p className="text-slate-500">{b.phone}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {b.roomsRequested}x {b.roomName}
                    </td>
                    <td className="py-3 px-4 tabular-nums text-slate-600">
                      {formatDateShort(b.checkIn)} → {formatDateShort(b.checkOut)}
                    </td>
                    <td className="py-3 px-4 tabular-nums text-slate-600">
                      {b.adults}A{b.children > 0 ? ` · ${b.children}C` : ''}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-medium">
                      {formatCurrency(b.estimatedPrice)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                          STATUS_BADGE[b.status] || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/admin/bookings/${b._id}`}
                        className="text-[#234638] font-semibold hover:underline"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-500">
                      No matching bookings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.total > meta.limit && (
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span className="tabular-nums">
              Page {meta.page} · Total {meta.total} records
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page * meta.limit >= meta.total}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
