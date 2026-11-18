import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, MessageCircle, Search } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '../../services/api';
import { usePublicData } from '../../context/SettingsContext';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { SEOHead } from '../../components/shared/SEOHead';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { SelectField } from '../../components/ui/select';
import { buildWhatsAppUrl, formatCurrency, formatDateShort, toInputDate } from '../../lib/utils';
import { MEAL_PLAN_CODES, MEAL_PLAN_DETAILS } from '../../../shared/constants/index.ts';
import type { MealPlanCode } from '../../../shared/types/index.ts';

export function BookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { settings, rooms } = usePublicData();
  const { customer } = useCustomerAuth();
  const [mode, setMode] = useState<'new' | 'lookup'>('new');

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const threeDays = new Date(today);
  threeDays.setDate(threeDays.getDate() + 3);

  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || toInputDate(tomorrow));
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || toInputDate(threeDays));
  const [adults, setAdults] = useState(Number(searchParams.get('adults') || 2));
  const [children, setChildren] = useState(Number(searchParams.get('children') || 0));
  const paramPlan = searchParams.get('mealPlan') as MealPlanCode | null;
  const initialPlan: MealPlanCode =
    paramPlan && MEAL_PLAN_CODES.includes(paramPlan) ? paramPlan : 'EP';

  const [roomId, setRoomId] = useState(searchParams.get('roomId') || '');
  const [roomsRequested, setRoomsRequested] = useState(1);
  const [mealPlan, setMealPlan] = useState<MealPlanCode>(initialPlan);
  const [extraPersons, setExtraPersons] = useState(0);
  const [arrivalTime, setArrivalTime] = useState('13:00 - 15:00');
  const [specialRequests, setSpecialRequests] = useState('');
  const [formError, setFormError] = useState('');

  // Lookup & cancellation state
  const [lookupRef, setLookupRef] = useState('');
  const [lookupResult, setLookupResult] = useState<Awaited<ReturnType<typeof api.lookupBooking>> | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [cancelEmail, setCancelEmail] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (customer) {
      setGuestName((prev) => prev || customer.name || '');
      setEmail((prev) => prev || customer.email || '');
      setPhone((prev) => prev || customer.phone || '');
    }
  }, [customer]);

  useEffect(() => {
    if (!roomId && rooms.length > 0) {
      setRoomId(rooms[0]._id);
    }
  }, [rooms, roomId]);

  const validDates = Boolean(checkIn && checkOut && new Date(checkOut) > new Date(checkIn));

  const availabilityQuery = useQuery({
    queryKey: ['booking-availability', checkIn, checkOut, roomId],
    queryFn: () => api.checkAvailability(checkIn, checkOut, roomId || undefined),
    enabled: validDates && Boolean(roomId),
  });

  const selectedRoom = rooms.find((r) => r._id === roomId);
  const availInfo = availabilityQuery.data?.[0];

  const nights = validDates
    ? Math.max(
        1,
        Math.round(
          (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
        )
      )
    : 0;
  const selectedPlanTariff = selectedRoom?.mealPlans?.find((p) => p.code === mealPlan);
  const roomNightlyRate = selectedPlanTariff
    ? selectedPlanTariff.roomRate
    : selectedRoom?.pricePerNight || 0;
  const extraNightlyRate = selectedPlanTariff ? selectedPlanTariff.extraPersonRate : 0;
  const estimatedTotal = selectedRoom
    ? (roomNightlyRate * roomsRequested + extraNightlyRate * extraPersons) * nights
    : 0;

  const createMutation = useMutation({
    mutationFn: api.createBooking,
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'bookings'] });
      toast.success(`Booking request ${booking.bookingReference} submitted.`);
      navigate(`/booking/success?ref=${encodeURIComponent(booking.bookingReference)}`, {
        state: { booking },
      });
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'Unable to submit booking request.';
      setFormError(msg);
      toast.error(msg);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ ref, email: em, reason }: { ref: string; email: string; reason: string }) =>
      api.requestCancellation(ref, em, reason),
    onSuccess: (res) => {
      toast.success(res.message);
      if (lookupResult) {
        setLookupResult({ ...lookupResult, cancellationRequested: true });
      }
      setCancelReason('');
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Could not submit cancellation request.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!validDates) {
      setFormError('Check-out date must be later than check-in date.');
      return;
    }
    if (!roomId) {
      setFormError('Please select a room category.');
      return;
    }
    if (availInfo && availInfo.availableUnits < roomsRequested) {
      setFormError(`Only ${availInfo.availableUnits} unit(s) open for these dates.`);
      return;
    }

    createMutation.mutate({
      guestName,
      phone,
      email,
      checkIn,
      checkOut,
      adults,
      children,
      roomId,
      roomsRequested,
      mealPlan,
      extraPersons,
      arrivalTime,
      specialRequests,
    });
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError('');
    setLookupResult(null);
    if (!lookupRef.trim()) return;
    try {
      const data = await api.lookupBooking(lookupRef.trim());
      setLookupResult(data);
    } catch (err) {
      setLookupError(err instanceof ApiError ? err.message : 'Booking reference not found.');
    }
  };

  const whatsappInquiryUrl = buildWhatsAppUrl(
    settings.whatsapp,
    `Hello ${settings.resortName}, I would like to inquire about a booking. Check-in: ${checkIn}, Check-out: ${checkOut}, Guests: ${adults + children}.`
  );

  return (
    <>
      <SEOHead
        title={`Book Your Stay — ${settings.resortName} Samalbong`}
        description="Submit a stay reservation request or track an existing booking reference at CLOUD VALLEY Resort, Samalbong."
        canonicalPath="/booking"
      />

      <section className="py-14 sm:py-20 bg-[#F8F5EF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-medium tracking-widest text-[#234638]">
                Reservations Desk
              </p>
              <h1 className="font-display text-4xl sm:text-5xl font-medium text-[#18352B]">
                Request Your Stay in Samalbong
              </h1>
              <p className="text-sm sm:text-base text-[#58636B]">
                Online submissions register a reservation request. Our team confirms availability and finalizes your booking shortly.
              </p>
            </div>

            <div className="inline-flex p-1 bg-[#E9E0D1] rounded-md self-start">
              <button
                type="button"
                onClick={() => setMode('new')}
                className={`px-4 py-2 rounded text-xs font-medium transition-colors ${
                  mode === 'new' ? 'bg-white text-[#18352B] shadow-xs' : 'text-[#58636B]'
                }`}
              >
                New Booking Request
              </button>
              <button
                type="button"
                onClick={() => setMode('lookup')}
                className={`px-4 py-2 rounded text-xs font-medium transition-colors ${
                  mode === 'lookup' ? 'bg-white text-[#18352B] shadow-xs' : 'text-[#58636B]'
                }`}
              >
                Track / Cancel Booking
              </button>
            </div>
          </div>

          {mode === 'new' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <form
                onSubmit={handleSubmit}
                className="lg:col-span-8 bg-white rounded-lg border border-[#18352B]/12 p-6 sm:p-8 space-y-6"
              >
                {customer && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#18352B]/10 text-xs text-[#58636B]">
                    <span>
                      Signed in as <strong className="text-[#18352B]">{customer.name}</strong> ({customer.email})
                    </span>
                    <Link to="/account" className="font-medium text-[#234638] hover:underline">
                      View My Reservations
                    </Link>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="guestName">Guest Full Name *</Label>
                    <Input
                      id="guestName"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g., Ananya Chatterjee"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone / WhatsApp Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98000 00000"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="guest@example.com"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="checkIn">Check-in Date *</Label>
                    <Input
                      id="checkIn"
                      type="date"
                      required
                      min={toInputDate(today)}
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="checkOut">Check-out Date *</Label>
                    <Input
                      id="checkOut"
                      type="date"
                      required
                      min={checkIn}
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="roomId">Room Category *</Label>
                    <SelectField
                      id="roomId"
                      required
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                    >
                      {rooms.map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.name} ({formatCurrency(r.pricePerNight, settings.currency)}/night · max {r.maxGuests} guests)
                        </option>
                      ))}
                    </SelectField>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="roomsRequested">Rooms Requested *</Label>
                    <SelectField
                      id="roomsRequested"
                      value={roomsRequested}
                      onChange={(e) => setRoomsRequested(Number(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? 'Room' : 'Rooms'}
                        </option>
                      ))}
                    </SelectField>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="mealPlan">Meal Plan *</Label>
                    <SelectField
                      id="mealPlan"
                      value={mealPlan}
                      onChange={(e) => setMealPlan(e.target.value as MealPlanCode)}
                    >
                      {MEAL_PLAN_CODES.map((code) => {
                        const plan = selectedRoom?.mealPlans?.find((p) => p.code === code);
                        const detail = MEAL_PLAN_DETAILS[code];
                        return (
                          <option key={code} value={code}>
                            {detail.shortName}
                            {plan ? ` (${formatCurrency(plan.roomRate, settings.currency)}/night)` : ''}
                          </option>
                        );
                      })}
                    </SelectField>
                    <p className="text-[11px] text-[#58636B]">
                      {MEAL_PLAN_DETAILS[mealPlan].description}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="extraPersons">Extra Persons (Above 12 Years)</Label>
                    <SelectField
                      id="extraPersons"
                      value={extraPersons}
                      onChange={(e) => setExtraPersons(Number(e.target.value))}
                    >
                      {[0, 1, 2, 3, 4].map((n) => (
                        <option key={n} value={n}>
                          {n === 0
                            ? '0 Extra Persons'
                            : `${n} Extra ${n === 1 ? 'Person' : 'Persons'}${
                                extraNightlyRate
                                  ? ` (+${formatCurrency(extraNightlyRate * n, settings.currency)}/night)`
                                  : ''
                              }`}
                        </option>
                      ))}
                    </SelectField>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="adults">Adults *</Label>
                    <SelectField
                      id="adults"
                      value={adults}
                      onChange={(e) => setAdults(Number(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? 'Adult' : 'Adults'}
                        </option>
                      ))}
                    </SelectField>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="children">Children</Label>
                    <SelectField
                      id="children"
                      value={children}
                      onChange={(e) => setChildren(Number(e.target.value))}
                    >
                      {[0, 1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? 'Child' : 'Children'}
                        </option>
                      ))}
                    </SelectField>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="arrivalTime">Expected Arrival Window</Label>
                    <SelectField
                      id="arrivalTime"
                      value={arrivalTime}
                      onChange={(e) => setArrivalTime(e.target.value)}
                    >
                      <option value="12:00 - 14:00">12:00 PM – 2:00 PM</option>
                      <option value="13:00 - 15:00">1:00 PM – 3:00 PM (Standard Check-in)</option>
                      <option value="15:00 - 18:00">3:00 PM – 6:00 PM</option>
                      <option value="After 18:00">After 6:00 PM (Evening Arrival)</option>
                    </SelectField>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="specialRequests">Special Requests or Meal Preferences</Label>
                    <Textarea
                      id="specialRequests"
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder="Airport/NJP cab transfer request, dietary preferences, celebration notes..."
                    />
                  </div>
                </div>

                {formError && (
                  <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-800">
                    {formError}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <p className="text-xs text-[#58636B] max-w-md">
                    {settings.defaultBookingPolicy}
                  </p>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Submitting Request...' : 'Submit Booking Request'}
                  </Button>
                </div>
              </form>

              {/* Stay Summary Sidebar */}
              <aside className="lg:col-span-4 space-y-5">
                <div className="bg-white rounded-lg border border-[#18352B]/12 p-6 space-y-4">
                  <h2 className="font-display text-xl font-medium text-[#18352B]">
                    Stay Summary
                  </h2>
                  <dl className="space-y-2.5 text-sm border-y border-[#18352B]/10 py-4">
                    <div className="flex justify-between">
                      <dt className="text-[#58636B]">Room</dt>
                      <dd className="font-medium text-right">{selectedRoom?.name || '—'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[#58636B]">Check-in</dt>
                      <dd className="tabular-nums">{formatDateShort(checkIn)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[#58636B]">Check-out</dt>
                      <dd className="tabular-nums">{formatDateShort(checkOut)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[#58636B]">Duration</dt>
                      <dd className="tabular-nums">{nights} {nights === 1 ? 'Night' : 'Nights'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[#58636B]">Meal Plan</dt>
                      <dd className="tabular-nums font-medium">{MEAL_PLAN_DETAILS[mealPlan].shortName}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[#58636B]">Party</dt>
                      <dd className="tabular-nums text-right">
                        {adults} Adults{children > 0 ? `, ${children} Children` : ''}
                        {extraPersons > 0 ? `, +${extraPersons} Extra (>12y)` : ''} · {roomsRequested} Room(s)
                      </dd>
                    </div>
                  </dl>

                  {availInfo && (
                    <div
                      className={`text-xs font-medium px-3 py-2 rounded-md flex items-center gap-2 ${
                        availInfo.availableUnits >= roomsRequested
                          ? 'bg-[#234638]/10 text-[#234638]'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>
                        {availInfo.availableUnits >= roomsRequested
                          ? `${availInfo.availableUnits} of ${availInfo.totalUnits} units currently open for these dates`
                          : `Only ${availInfo.availableUnits} unit(s) open for these dates`}
                      </span>
                    </div>
                  )}

                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-xs text-[#58636B]">Estimated Tariff</span>
                    <span className="font-display text-2xl font-semibold text-[#18352B] tabular-nums">
                      {formatCurrency(estimatedTotal, settings.currency)}
                    </span>
                  </div>
                </div>

                <div className="bg-[#234638] text-[#F8F5EF] rounded-lg p-6 space-y-3">
                  <h3 className="font-display text-lg">Prefer to ask on WhatsApp?</h3>
                  <p className="text-xs text-[#F8F5EF]/80 leading-relaxed">
                    Speak directly with our Samalbong reservations desk for custom group stays or road transfer arrangements.
                  </p>
                  <Button asChild variant="accent" className="w-full">
                    <a
                      href={whatsappInquiryUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Inquire via WhatsApp</span>
                    </a>
                  </Button>
                </div>
              </aside>
            </div>
          ) : (
            <div className="max-w-2xl bg-white rounded-lg border border-[#18352B]/12 p-6 sm:p-8 space-y-6">
              <form onSubmit={handleLookup} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="lookupRef">Booking Reference ID</Label>
                  <div className="flex gap-2">
                    <Input
                      id="lookupRef"
                      value={lookupRef}
                      onChange={(e) => setLookupRef(e.target.value)}
                      placeholder="e.g., CV-2611-5190"
                      required
                    />
                    <Button type="submit">
                      <Search className="w-4 h-4" />
                      <span>Lookup</span>
                    </Button>
                  </div>
                </div>
                {lookupError && <p className="text-xs text-red-700">{lookupError}</p>}
              </form>

              {lookupResult && (
                <div className="border-t border-[#18352B]/10 pt-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-mono text-[#58636B]">
                        {lookupResult.bookingReference}
                      </p>
                      <h2 className="font-display text-2xl text-[#18352B]">
                        {lookupResult.guestName}
                      </h2>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded bg-[#E9E0D1] text-[#18352B]">
                      Status: {lookupResult.status}
                    </span>
                  </div>

                  <dl className="grid grid-cols-2 gap-3 text-sm bg-[#F8F5EF] p-4 rounded-md">
                    <div>
                      <dt className="text-xs text-[#58636B]">Room</dt>
                      <dd className="font-medium">{lookupResult.roomName}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[#58636B]">Dates</dt>
                      <dd className="tabular-nums">
                        {formatDateShort(lookupResult.checkIn || '')} – {formatDateShort(lookupResult.checkOut || '')}
                      </dd>
                    </div>
                  </dl>

                  {lookupResult.cancellationRequested ? (
                    <p className="text-xs text-[#234638] font-medium">
                      A cancellation request has already been logged for this booking. Our team will update you shortly.
                    </p>
                  ) : (
                    !['Cancelled', 'Rejected', 'Completed'].includes(lookupResult.status || '') && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          cancelMutation.mutate({
                            ref: lookupResult.bookingReference!,
                            email: cancelEmail,
                            reason: cancelReason,
                          });
                        }}
                        className="space-y-3 pt-2 border-t border-[#18352B]/10"
                      >
                        <h3 className="text-sm font-medium text-[#18352B]">
                          Request Booking Cancellation
                        </h3>
                        <Input
                          type="email"
                          required
                          value={cancelEmail}
                          onChange={(e) => setCancelEmail(e.target.value)}
                          placeholder="Confirm your booking email address"
                        />
                        <Textarea
                          required
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          placeholder="Reason for cancellation..."
                        />
                        <Button
                          type="submit"
                          variant="destructive"
                          size="sm"
                          disabled={cancelMutation.isPending}
                        >
                          {cancelMutation.isPending ? 'Submitting...' : 'Submit Cancellation Request'}
                        </Button>
                      </form>
                    )
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
