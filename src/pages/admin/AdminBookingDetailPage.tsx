import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Printer, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Skeleton } from '../../components/ui/skeleton';
import { formatCurrency, formatDateShort } from '../../lib/utils';
import type { BookingStatus } from '../../../shared/types/index.ts';

export function AdminBookingDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const bookingQuery = useQuery({
    queryKey: ['admin', 'booking', id],
    queryFn: () => api.getAdminBookingById(id),
    enabled: Boolean(id),
  });

  const booking = bookingQuery.data;

  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [roomsRequested, setRoomsRequested] = useState(1);
  const [internalNotes, setInternalNotes] = useState('');

  useEffect(() => {
    if (booking) {
      setGuestName(booking.guestName);
      setPhone(booking.phone);
      setEmail(booking.email);
      setCheckIn(booking.checkIn.slice(0, 10));
      setCheckOut(booking.checkOut.slice(0, 10));
      setRoomsRequested(booking.roomsRequested);
      setInternalNotes(booking.internalNotes || '');
    }
  }, [booking]);

  const statusMutation = useMutation({
    mutationFn: (status: BookingStatus) => api.updateBookingStatus(id, status, internalNotes),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'booking', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] });
      toast.success(`Booking marked as ${updated.status}.`);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Status update failed.');
    },
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      api.updateBooking(id, {
        guestName,
        phone,
        email,
        checkIn,
        checkOut,
        roomsRequested,
        internalNotes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'booking', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
      toast.success('Booking details saved.');
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Could not update booking.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
      toast.success('Booking record deleted.');
      navigate('/admin/bookings');
    },
  });

  if (bookingQuery.isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!booking) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center space-y-3">
        <p className="text-sm text-slate-600">Booking record not found.</p>
        <Button asChild variant="outline">
          <Link to="/admin/bookings">Back to Bookings</Link>
        </Button>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <Link
          to="/admin/bookings"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Bookings</span>
        </Link>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />
            <span>Print Slip</span>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleSave}
          className="lg:col-span-8 bg-white rounded-lg border border-slate-200 p-6 space-y-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <p className="text-xs font-mono text-slate-500">{booking.bookingReference}</p>
              <h1 className="font-display text-2xl font-semibold text-slate-900 mt-0.5">
                {booking.guestName}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Submitted {formatDateShort(booking.createdAt)} · {booking.roomName}
              </p>
            </div>
            <span className="px-3 py-1 rounded text-xs font-semibold bg-[#E9E0D1] text-[#18352B]">
              {booking.status}
            </span>
          </div>

          {booking.cancellationRequested && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3.5 text-xs text-red-800">
              <strong>Guest Cancellation Requested:</strong> {booking.cancellationReason || 'No reason provided'}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Guest Name</Label>
              <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Units Requested</Label>
              <Input
                type="number"
                min={1}
                value={roomsRequested}
                onChange={(e) => setRoomsRequested(Number(e.target.value))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Check-in</Label>
              <Input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Check-out</Label>
              <Input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required />
            </div>
          </div>

          <div className="bg-slate-50 rounded-md p-4 text-xs space-y-1.5">
            <p>
              <strong>Party:</strong> {booking.adults} Adults, {booking.children} Children
              {booking.extraPersons ? ` (+${booking.extraPersons} Extra Person >12 yrs)` : ''} ·{' '}
              <strong>Meal Plan:</strong> {booking.mealPlan || 'EP'} ·{' '}
              <strong>Arrival Window:</strong> {booking.arrivalTime || 'Standard'}
            </p>
            <p>
              <strong>Guest Special Requests:</strong> {booking.specialRequests || 'None'}
            </p>
            <p className="font-mono font-semibold text-sm pt-1">
              Estimated Tariff: {formatCurrency(booking.estimatedPrice)}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Internal Staff Notes</Label>
            <Textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Assigned cottage number, transfer driver, advance received..."
            />
          </div>

          <div className="flex justify-end no-print">
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>

        {/* Status Actions Card */}
        <div className="lg:col-span-4 bg-white rounded-lg border border-slate-200 p-6 space-y-4 no-print">
          <h2 className="text-sm font-semibold text-slate-900">Workflow Actions</h2>
          <p className="text-xs text-slate-500">
            Confirming validates real-time unit availability across overlapping confirmed bookings and blocked dates.
          </p>

          <div className="space-y-2.5">
            <Button
              className="w-full"
              disabled={booking.status === 'Confirmed' || statusMutation.isPending}
              onClick={() => statusMutation.mutate('Confirmed')}
            >
              Confirm Reservation
            </Button>
            <Button
              variant="outline"
              className="w-full"
              disabled={booking.status === 'Completed' || statusMutation.isPending}
              onClick={() => statusMutation.mutate('Completed')}
            >
              Mark Stay Completed
            </Button>
            <Button
              variant="outline"
              className="w-full text-amber-700 hover:bg-amber-50"
              disabled={booking.status === 'Rejected' || statusMutation.isPending}
              onClick={() => statusMutation.mutate('Rejected')}
            >
              Reject Request
            </Button>
            <Button
              variant="destructive"
              className="w-full"
              disabled={booking.status === 'Cancelled' || statusMutation.isPending}
              onClick={() => statusMutation.mutate('Cancelled')}
            >
              Cancel Booking
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
