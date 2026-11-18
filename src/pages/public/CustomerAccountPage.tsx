import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, LogOut, MessageCircle, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '../../services/api';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { usePublicData } from '../../context/SettingsContext';
import { SEOHead } from '../../components/shared/SEOHead';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { buildWhatsAppUrl, formatCurrency, formatDateShort } from '../../lib/utils';
import { MEAL_PLAN_DETAILS } from '../../../shared/constants/index.ts';
import type { BookingStatus } from '../../../shared/types/index.ts';

function statusStyle(status: BookingStatus): string {
  switch (status) {
    case 'Confirmed':
      return 'bg-[#234638]/12 text-[#234638]';
    case 'Pending':
      return 'bg-[#C6A66B]/20 text-[#6B5322]';
    case 'Completed':
      return 'bg-[#18352B]/10 text-[#18352B]';
    case 'Cancelled':
    case 'Rejected':
      return 'bg-red-50 text-red-700';
    default:
      return 'bg-[#E9E0D1] text-[#18352B]';
  }
}

export function CustomerAccountPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { settings } = usePublicData();
  const { customer, setAuthenticatedCustomer, logoutCustomer } = useCustomerAuth();

  const [activeTab, setActiveTab] = useState<'bookings' | 'profile'>('bookings');
  const [cancellingRef, setCancellingRef] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Profile form state
  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone);
    }
  }, [customer]);

  const bookingsQuery = useQuery({
    queryKey: ['customer', 'bookings'],
    queryFn: api.getCustomerBookings,
    enabled: Boolean(customer),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ ref, reason }: { ref: string; reason: string }) =>
      api.requestCustomerCancellation(ref, reason),
    onSuccess: () => {
      toast.success('Cancellation request recorded.');
      setCancellingRef(null);
      setCancelReason('');
      queryClient.invalidateQueries({ queryKey: ['customer', 'bookings'] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Unable to submit cancellation request.');
    },
  });

  const profileMutation = useMutation({
    mutationFn: api.updateCustomerProfile,
    onSuccess: (updated) => {
      setAuthenticatedCustomer(updated);
      setCurrentPassword('');
      setNewPassword('');
      setProfileError('');
      toast.success('Your guest profile has been updated.');
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'Unable to update profile.';
      setProfileError(msg);
      toast.error(msg);
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    if (newPassword && newPassword.length < 8) {
      setProfileError('New password must be at least 8 characters.');
      return;
    }
    profileMutation.mutate({
      name: name.trim(),
      phone: phone.trim(),
      ...(newPassword ? { currentPassword, newPassword } : {}),
    });
  };

  const handleSignOut = async () => {
    await logoutCustomer();
    toast.success('You have signed out.');
    navigate('/', { replace: true });
  };

  const bookings = bookingsQuery.data || [];

  return (
    <>
      <SEOHead
        title={`My Guest Account — ${settings.resortName} Samalbong`}
        description="View your CLOUD VALLEY reservation requests, stay details, and guest profile."
        canonicalPath="/account"
      />

      <section className="py-12 sm:py-18 bg-[#F8F5EF]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Header Row */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pb-6 border-b border-[#18352B]/12">
            <div className="space-y-1.5">
              <p className="text-xs font-medium tracking-widest text-[#234638]">
                Guest Sanctuary Account
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-medium text-[#18352B]">
                Welcome, {customer?.name}
              </h1>
              <p className="text-sm text-[#58636B] tabular-nums">
                {customer?.email} · {customer?.phone}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild>
                <Link to="/booking">Request a Stay</Link>
              </Button>
              <Button type="button" variant="outline" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>

          {/* Section Switcher */}
          <div className="inline-flex p-1 bg-[#E9E0D1] rounded-md">
            <button
              type="button"
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-2 rounded text-xs font-medium transition-colors inline-flex items-center gap-2 ${
                activeTab === 'bookings' ? 'bg-white text-[#18352B] shadow-xs' : 'text-[#58636B]'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>My Reservations ({bookings.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded text-xs font-medium transition-colors inline-flex items-center gap-2 ${
                activeTab === 'profile' ? 'bg-white text-[#18352B] shadow-xs' : 'text-[#58636B]'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Profile & Security</span>
            </button>
          </div>

          {activeTab === 'bookings' ? (
            bookingsQuery.isLoading ? (
              <div className="bg-white rounded-lg border border-[#18352B]/12 p-10 text-center text-sm text-[#58636B]">
                Loading your reservations...
              </div>
            ) : bookings.length === 0 ? (
              <div className="bg-white rounded-lg border border-[#18352B]/12 p-10 text-center space-y-4">
                <h2 className="font-display text-2xl text-[#18352B]">
                  No reservations yet
                </h2>
                <p className="text-sm text-[#58636B] max-w-md mx-auto">
                  Explore our timber suites and hillside cottages in Samalbong to submit your first stay request.
                </p>
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <Button asChild>
                    <Link to="/booking">Request Your Stay</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/rooms">Explore Rooms</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => {
                  const canCancel =
                    !booking.cancellationRequested &&
                    !['Cancelled', 'Rejected', 'Completed'].includes(booking.status);

                  const whatsappUrl = buildWhatsAppUrl(
                    settings.whatsapp,
                    `Hello ${settings.resortName}, I am inquiring about my reservation ${booking.bookingReference} (${booking.roomName}).`
                  );

                  return (
                    <div
                      key={booking._id}
                      className="bg-white rounded-lg border border-[#18352B]/12 p-6 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#18352B]/10">
                        <div className="space-y-1">
                          <p className="text-xs font-mono text-[#58636B]">
                            {booking.bookingReference} · Submitted {formatDateShort(booking.createdAt)}
                          </p>
                          <h2 className="font-display text-2xl font-medium text-[#18352B]">
                            {booking.roomName}
                          </h2>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-center">
                          <span
                            className={`text-xs font-semibold px-3 py-1 rounded ${statusStyle(booking.status)}`}
                          >
                            {booking.status}
                          </span>
                          {booking.cancellationRequested && booking.status !== 'Cancelled' && (
                            <span className="text-xs font-medium px-2.5 py-1 rounded bg-amber-50 text-amber-800">
                              Cancellation Requested
                            </span>
                          )}
                        </div>
                      </div>

                      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <dt className="text-xs text-[#58636B]">Check-in</dt>
                          <dd className="font-medium tabular-nums mt-0.5">
                            {formatDateShort(booking.checkIn)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-[#58636B]">Check-out</dt>
                          <dd className="font-medium tabular-nums mt-0.5">
                            {formatDateShort(booking.checkOut)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-[#58636B]">Party, Plan & Rooms</dt>
                          <dd className="tabular-nums mt-0.5">
                            {booking.adults} Adults
                            {booking.children > 0 ? `, ${booking.children} Children` : ''}
                            {booking.extraPersons ? ` (+${booking.extraPersons} Extra)` : ''} ·{' '}
                            {booking.mealPlan ? MEAL_PLAN_DETAILS[booking.mealPlan].code : 'EP'} ·{' '}
                            {booking.roomsRequested} Room(s)
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-[#58636B]">Estimated Tariff</dt>
                          <dd className="font-display text-lg font-semibold text-[#18352B] tabular-nums">
                            {formatCurrency(booking.estimatedPrice, settings.currency)}
                          </dd>
                        </div>
                      </dl>

                      {booking.specialRequests && (
                        <p className="text-xs text-[#58636B] bg-[#F8F5EF] px-3.5 py-2.5 rounded">
                          <span className="font-medium text-[#18352B]">Note: </span>
                          {booking.specialRequests}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#234638] hover:underline"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Message Reservations Desk</span>
                        </a>

                        {canCancel && cancellingRef !== booking.bookingReference && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCancellingRef(booking.bookingReference);
                              setCancelReason('');
                            }}
                          >
                            Request Cancellation
                          </Button>
                        )}
                      </div>

                      {cancellingRef === booking.bookingReference && (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            cancelMutation.mutate({
                              ref: booking.bookingReference,
                              reason: cancelReason,
                            });
                          }}
                          className="pt-4 border-t border-[#18352B]/10 space-y-3"
                        >
                          <Label htmlFor={`cancel-reason-${booking._id}`}>
                            Reason for Cancellation Request
                          </Label>
                          <Textarea
                            id={`cancel-reason-${booking._id}`}
                            required
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Please share a brief reason so our team can assist you..."
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              type="submit"
                              variant="destructive"
                              size="sm"
                              disabled={cancelMutation.isPending}
                            >
                              {cancelMutation.isPending ? 'Submitting...' : 'Confirm Request'}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setCancellingRef(null)}
                            >
                              Keep Reservation
                            </Button>
                          </div>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <form
              onSubmit={handleProfileSubmit}
              className="max-w-xl bg-white rounded-lg border border-[#18352B]/12 p-6 sm:p-8 space-y-5"
            >
              <h2 className="font-display text-2xl font-medium text-[#18352B]">
                Guest Details & Password
              </h2>

              <div className="space-y-1.5">
                <Label htmlFor="acct-email">Email Address</Label>
                <Input id="acct-email" value={customer?.email || ''} disabled />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="acct-name">Full Name *</Label>
                <Input
                  id="acct-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="acct-phone">Phone / WhatsApp Number *</Label>
                <Input
                  id="acct-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="pt-4 border-t border-[#18352B]/10 space-y-4">
                <p className="text-xs font-medium text-[#18352B]">
                  Change Password (leave blank to keep current password)
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="acct-cur-pw">Current Password</Label>
                  <Input
                    id="acct-cur-pw"
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="acct-new-pw">New Password (min 8 characters)</Label>
                  <Input
                    id="acct-new-pw"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>

              {profileError && (
                <div className="rounded-md bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-800">
                  {profileError}
                </div>
              )}

              <Button type="submit" disabled={profileMutation.isPending}>
                {profileMutation.isPending ? 'Saving Changes...' : 'Save Profile'}
              </Button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
