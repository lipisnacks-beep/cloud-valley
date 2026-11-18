import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, MessageCircle } from 'lucide-react';
import { api } from '../../services/api';
import { usePublicData } from '../../context/SettingsContext';
import { SEOHead } from '../../components/shared/SEOHead';
import { Button } from '../../components/ui/button';
import { buildWhatsAppUrl, formatCurrency, formatDateShort } from '../../lib/utils';
import { MEAL_PLAN_DETAILS } from '../../../shared/constants/index.ts';
import type { Booking } from '../../../shared/types/index.ts';

export function BookingSuccessPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { settings } = usePublicData();
  const ref = searchParams.get('ref') || '';
  const stateBooking = (location.state as { booking?: Booking } | null)?.booking;

  const lookupQuery = useQuery({
    queryKey: ['booking-success', ref],
    queryFn: () => api.lookupBooking(ref),
    enabled: Boolean(ref) && !stateBooking,
  });

  const booking = stateBooking || lookupQuery.data;

  const whatsappHref = buildWhatsAppUrl(
    settings.whatsapp,
    `Hello ${settings.resortName}, I just submitted booking request ${booking?.bookingReference || ref}. Please let me know once availability is confirmed.`
  );

  return (
    <>
      <SEOHead
        title={`Booking Request Received — ${settings.resortName}`}
        description="Your reservation request at CLOUD VALLEY Samalbong has been recorded."
        canonicalPath="/booking/success"
      />

      <section className="py-16 sm:py-24 bg-[#F8F5EF]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-lg border border-[#18352B]/12 p-7 sm:p-10 space-y-6">
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-full bg-[#234638]/10 text-[#234638] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium tracking-wider text-[#234638]">
                  Request Status: {booking?.status || 'Pending'}
                </p>
                <h1 className="font-display text-3xl font-medium text-[#18352B]">
                  Reservation Request Received
                </h1>
                <p className="text-sm text-[#58636B]">
                  Thank you for choosing CLOUD VALLEY, Samalbong. Our team will verify suite availability and confirm your stay shortly.
                </p>
              </div>
            </div>

            {booking ? (
              <dl className="bg-[#F8F5EF] rounded-md p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm border border-[#18352B]/10">
                <div>
                  <dt className="text-xs text-[#58636B]">Booking Reference ID</dt>
                  <dd className="font-mono font-semibold text-[#18352B] mt-0.5">
                    {booking.bookingReference}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#58636B]">Guest Name</dt>
                  <dd className="font-medium text-[#18352B] mt-0.5">{booking.guestName}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#58636B]">Check-in</dt>
                  <dd className="tabular-nums mt-0.5">
                    {formatDateShort(booking.checkIn || '')} ({settings.checkInTime})
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#58636B]">Check-out</dt>
                  <dd className="tabular-nums mt-0.5">
                    {formatDateShort(booking.checkOut || '')} ({settings.checkOutTime})
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#58636B]">Room & Meal Plan</dt>
                  <dd className="font-medium mt-0.5">
                    {booking.roomsRequested}x {booking.roomName} ·{' '}
                    {booking.mealPlan ? MEAL_PLAN_DETAILS[booking.mealPlan].shortName : 'EP · Room Only'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#58636B]">Guest Count</dt>
                  <dd className="tabular-nums mt-0.5">
                    {booking.adults} Adults{booking.children ? `, ${booking.children} Children` : ''}
                    {booking.extraPersons ? ` (+${booking.extraPersons} Extra >12 yrs)` : ''}
                  </dd>
                </div>
                {booking.estimatedPrice !== undefined && (
                  <div className="sm:col-span-2 pt-2 border-t border-[#18352B]/10 flex justify-between">
                    <dt className="text-xs text-[#58636B]">Estimated Stay Tariff</dt>
                    <dd className="font-display text-lg font-semibold text-[#18352B] tabular-nums">
                      {formatCurrency(booking.estimatedPrice, settings.currency)}
                    </dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-sm text-[#58636B]">
                Reference: <span className="font-mono font-semibold">{ref || 'Submitted'}</span>
              </p>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild>
                <Link to="/account">View My Reservations</Link>
              </Button>
              <Button asChild variant="accent">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Message Desk on WhatsApp</span>
                </a>
              </Button>
              <Button asChild variant="outline">
                <Link to="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
