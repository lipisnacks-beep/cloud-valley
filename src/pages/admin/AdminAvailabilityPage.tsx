import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Lock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { SelectField } from '../../components/ui/select';
import { formatDateShort, toInputDate } from '../../lib/utils';

export function AdminAvailabilityPage() {
  const queryClient = useQueryClient();
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  });
  const [selectedRoomId, setSelectedRoomId] = useState('All');

  // Block form
  const [blockRoomId, setBlockRoomId] = useState('');
  const [startDate, setStartDate] = useState(toInputDate(new Date()));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return toInputDate(d);
  });
  const [unitsBlocked, setUnitsBlocked] = useState(1);
  const [reason, setReason] = useState('Seasonal Maintenance');

  const availQuery = useQuery({
    queryKey: ['admin', 'availability'],
    queryFn: api.getAdminAvailability,
  });

  const blockMutation = useMutation({
    mutationFn: api.blockDates,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'availability'] });
      toast.success('Dates blocked successfully.');
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Unable to block dates.');
    },
  });

  const unblockMutation = useMutation({
    mutationFn: api.unblockDates,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'availability'] });
      toast.success('Date block removed.');
    },
  });

  const rooms = availQuery.data?.rooms || [];
  const bookings = availQuery.data?.bookings || [];
  const blockedDates = availQuery.data?.blockedDates || [];

  const effectiveBlockRoomId = blockRoomId || rooms[0]?._id || '';

  const year = viewMonth.getUTCFullYear();
  const month = viewMonth.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const startDayOfWeek = new Date(Date.UTC(year, month, 1)).getUTCDay();

  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => {
    const dayDate = new Date(Date.UTC(year, month, i + 1));
    const dayMs = dayDate.getTime();
    const dayIso = dayDate.toISOString().slice(0, 10);

    const activeBookings = bookings.filter((b) => {
      if (selectedRoomId !== 'All' && b.roomId !== selectedRoomId) return false;
      const s = new Date(b.checkIn).getTime();
      const e = new Date(b.checkOut).getTime();
      return s <= dayMs && e > dayMs;
    });

    const activeBlocks = blockedDates.filter((blk) => {
      if (selectedRoomId !== 'All' && blk.roomId !== selectedRoomId) return false;
      const s = new Date(blk.startDate).getTime();
      const e = new Date(blk.endDate).getTime();
      return s <= dayMs && e > dayMs;
    });

    return {
      day: i + 1,
      dayIso,
      confirmedCount: activeBookings
        .filter((b) => b.status === 'Confirmed')
        .reduce((sum, b) => sum + b.roomsRequested, 0),
      pendingCount: activeBookings
        .filter((b) => b.status === 'Pending')
        .reduce((sum, b) => sum + b.roomsRequested, 0),
      blockedCount: activeBlocks.reduce((sum, blk) => sum + blk.unitsBlocked, 0),
    };
  });

  const handleBlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveBlockRoomId) return;
    blockMutation.mutate({
      roomId: effectiveBlockRoomId,
      startDate,
      endDate,
      unitsBlocked,
      reason,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900">
            Availability & Calendar
          </h1>
          <p className="text-xs text-slate-500">
            Inspect confirmed occupancy, pending requests, and manually block suite inventory.
          </p>
        </div>

        <SelectField
          value={selectedRoomId}
          onChange={(e) => setSelectedRoomId(e.target.value)}
          className="sm:w-64"
        >
          <option value="All">All Room Categories</option>
          {rooms.map((r) => (
            <option key={r._id} value={r._id}>
              {r.name} ({r.totalUnits} units)
            </option>
          ))}
        </SelectField>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Month Grid */}
        <div className="lg:col-span-8 bg-white rounded-lg border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-medium text-slate-900">
              {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
            </h2>
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setViewMonth(new Date(Date.UTC(year, month - 1, 1)))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setViewMonth(new Date(Date.UTC(year, month + 1, 1)))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-medium text-slate-500">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-1.5">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: startDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-20 rounded bg-slate-50/50" />
            ))}
            {calendarDays.map((cell) => (
              <div
                key={cell.dayIso}
                className="h-20 rounded border border-slate-200 p-1.5 flex flex-col justify-between text-[11px]"
              >
                <span className="font-mono font-medium text-slate-700 tabular-nums">
                  {cell.day}
                </span>
                <div className="space-y-0.5 leading-tight">
                  {cell.confirmedCount > 0 && (
                    <div className="bg-emerald-100 text-emerald-900 px-1 rounded truncate tabular-nums">
                      {cell.confirmedCount} Conf
                    </div>
                  )}
                  {cell.pendingCount > 0 && (
                    <div className="bg-amber-100 text-amber-900 px-1 rounded truncate tabular-nums">
                      {cell.pendingCount} Pend
                    </div>
                  )}
                  {cell.blockedCount > 0 && (
                    <div className="bg-red-100 text-red-900 px-1 rounded truncate tabular-nums">
                      {cell.blockedCount} Blk
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Manual Date Block Form & Active Blocks */}
        <div className="lg:col-span-4 space-y-5">
          <form
            onSubmit={handleBlockSubmit}
            className="bg-white rounded-lg border border-slate-200 p-5 space-y-4"
          >
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#234638]" />
              <h2 className="text-sm font-semibold text-slate-900">Block Suite Dates</h2>
            </div>

            <div className="space-y-1.5">
              <Label>Room Category</Label>
              <SelectField
                value={effectiveBlockRoomId}
                onChange={(e) => setBlockRoomId(e.target.value)}
              >
                {rooms.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name}
                  </option>
                ))}
              </SelectField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Units to Block</Label>
              <Input
                type="number"
                min={1}
                value={unitsBlocked}
                onChange={(e) => setUnitsBlocked(Number(e.target.value))}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>

            <Button type="submit" className="w-full" disabled={blockMutation.isPending}>
              {blockMutation.isPending ? 'Blocking...' : 'Apply Date Block'}
            </Button>
          </form>

          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">Active Manual Blocks</h2>
            {blockedDates.length === 0 ? (
              <p className="text-xs text-slate-500">No dates manually blocked.</p>
            ) : (
              <div className="space-y-2.5">
                {blockedDates.map((blk) => (
                  <div
                    key={blk._id}
                    className="p-3 rounded border border-slate-200 flex items-start justify-between gap-2 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{blk.roomName}</p>
                      <p className="text-slate-600 tabular-nums">
                        {formatDateShort(blk.startDate)} → {formatDateShort(blk.endDate)} ·{' '}
                        {blk.unitsBlocked} unit(s)
                      </p>
                      {blk.reason && <p className="text-slate-500 mt-0.5">{blk.reason}</p>}
                    </div>
                    <button
                      type="button"
                      aria-label="Remove date block"
                      onClick={() => unblockMutation.mutate(blk._id)}
                      className="p-1.5 text-red-700 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
