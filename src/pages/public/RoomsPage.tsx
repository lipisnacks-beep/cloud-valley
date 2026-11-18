import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Check } from 'lucide-react';
import { api } from '../../services/api';
import { usePublicData } from '../../context/SettingsContext';
import { ResilientImage } from '../../components/shared/ResilientImage';
import { SEOHead } from '../../components/shared/SEOHead';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { formatCurrency, toInputDate } from '../../lib/utils';
import { MEAL_PLAN_CODES, MEAL_PLAN_DETAILS } from '../../../shared/constants/index.ts';

export function RoomsPage() {
  const { settings, rooms, isLoading } = usePublicData();
  const [guestFilter, setGuestFilter] = useState<number>(0);

  const today = new Date();
  const tmr = new Date(today);
  tmr.setDate(tmr.getDate() + 1);
  const out = new Date(today);
  out.setDate(out.getDate() + 3);

  const [checkIn, setCheckIn] = useState(toInputDate(tmr));
  const [checkOut, setCheckOut] = useState(toInputDate(out));
  const [checkEnabled, setCheckEnabled] = useState(false);

  const availabilityQuery = useQuery({
    queryKey: ['public', 'availability', checkIn, checkOut],
    queryFn: () => api.checkAvailability(checkIn, checkOut),
    enabled: checkEnabled && Boolean(checkIn && checkOut && new Date(checkOut) > new Date(checkIn)),
  });

  const availMap = new Map(
    (availabilityQuery.data || []).map((item) => [item.roomId, item])
  );

  const filteredRooms = rooms.filter((r) => (guestFilter > 0 ? r.maxGuests >= guestFilter : true));

  return (
    <>
      <SEOHead
        title={`Rooms & Tariff — ${settings.resortName} Samalbong`}
        description="Explore Deluxe Rooms, Premium Rooms, and Four Bedded Rooms at Cloud Valley Resort, Samalbong. View full EP, CP, MAP, and AP meal plan rates with Mount Kanchenjunga views from every room."
        canonicalPath="/rooms"
      />

      <section className="py-16 sm:py-22 bg-[#F8F5EF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-medium tracking-widest text-[#234638]">
              Rooms & Tariff · 9 Double Bedded · 2 Four Bedded Rooms
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-medium text-[#18352B] text-balance">
              Full Mount Kanchenjunga views from every room.
            </h1>
            <p className="text-base text-[#58636B]">
              Samalbong’s only 3-star property offers flexible European (EP), Continental (CP), Modified American (MAP), and American (AP) room tariffs. Check date availability or compare plan rates below.
            </p>
          </div>

          {/* Availability & Capacity Filter Bar */}
          <div className="bg-white rounded-lg border border-[#18352B]/12 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-[#58636B] mb-1">
                  <Calendar className="w-3.5 h-3.5 text-[#234638]" />
                  <span>Check-in Date</span>
                </label>
                <input
                  type="date"
                  min={toInputDate(today)}
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full h-10 rounded-md border border-[#18352B]/18 px-3 text-sm"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-[#58636B] mb-1">
                  <Calendar className="w-3.5 h-3.5 text-[#234638]" />
                  <span>Check-out Date</span>
                </label>
                <input
                  type="date"
                  min={checkIn}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full h-10 rounded-md border border-[#18352B]/18 px-3 text-sm"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={() => setCheckEnabled(true)}
                  className="w-full"
                >
                  Verify Date Availability
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-[#E9E0D1]/60 rounded-md">
              {[
                { label: 'All Rooms', val: 0 },
                { label: '2+ Guests', val: 2 },
                { label: '4+ Guests', val: 4 },
              ].map((tab) => (
                <button
                  key={tab.val}
                  type="button"
                  onClick={() => setGuestFilter(tab.val)}
                  className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                    guestFilter === tab.val
                      ? 'bg-white text-[#18352B] shadow-xs'
                      : 'text-[#58636B] hover:text-[#18352B]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} className="h-72 w-full" />
              ))}
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="bg-white rounded-lg border border-[#18352B]/10 p-10 text-center space-y-3">
              <p className="font-display text-xl text-[#18352B]">No rooms match that guest capacity filter.</p>
              <Button variant="outline" onClick={() => setGuestFilter(0)}>
                Show All Rooms
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {filteredRooms.map((room) => {
                const avail = availMap.get(room._id);
                return (
                  <article
                    key={room._id}
                    className="bg-white rounded-lg border border-[#18352B]/12 overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch"
                  >
                    <div className="lg:col-span-5 aspect-[4/3] lg:aspect-auto bg-[#E9E0D1]">
                      <ResilientImage
                        src={room.images[0]?.url}
                        alt={room.images[0]?.alt || room.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs text-[#58636B] tabular-nums">
                            {[
                              `Up to ${room.maxGuests} Guests`,
                              `${room.totalUnits} Units`,
                              room.bedType,
                              room.viewType,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                          {avail && (
                            <span
                              className={`text-xs font-medium tabular-nums ${
                                avail.isAvailable ? 'text-[#234638]' : 'text-red-700'
                              }`}
                            >
                              {avail.isAvailable
                                ? `${avail.availableUnits} of ${avail.totalUnits} units open`
                                : 'Unavailable for selected dates'}
                            </span>
                          )}
                        </div>

                        <h2 className="font-display text-2xl sm:text-3xl font-medium text-[#18352B]">
                          {room.name}
                        </h2>
                        <p className="text-sm text-[#58636B] leading-relaxed">
                          {room.description}
                        </p>

                        {/* Brochure Meal Plan Rate Card */}
                        {room.mealPlans && room.mealPlans.length > 0 && (
                          <div className="pt-2">
                            <div className="overflow-x-auto border border-[#18352B]/12 rounded-md">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-[#F8F5EF] text-[#58636B] border-b border-[#18352B]/10">
                                  <tr>
                                    <th className="py-2 px-3 font-medium">Meal Plan</th>
                                    <th className="py-2 px-3 font-medium text-right">Room / Night</th>
                                    <th className="py-2 px-3 font-medium text-right">Extra Person (&gt;12 yrs)</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#18352B]/10">
                                  {room.mealPlans.map((plan) => (
                                    <tr key={plan.code} className="hover:bg-[#F8F5EF]/50">
                                      <td className="py-2 px-3 font-medium text-[#18352B]">
                                        <span className="font-mono font-semibold text-[#234638] mr-1.5">
                                          {plan.code}
                                        </span>
                                        <span className="text-[#58636B] font-normal">
                                          — {plan.description}
                                        </span>
                                      </td>
                                      <td className="py-2 px-3 text-right font-mono font-semibold text-[#18352B] tabular-nums">
                                        {formatCurrency(plan.roomRate, settings.currency)}
                                      </td>
                                      <td className="py-2 px-3 text-right font-mono text-[#58636B] tabular-nums">
                                        {formatCurrency(plan.extraPersonRate, settings.currency)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 pt-2">
                          {room.amenities.slice(0, 6).map((a) => (
                            <div key={a} className="flex items-center gap-2 text-xs text-[#18352B]">
                              <Check className="w-3.5 h-3.5 text-[#234638] shrink-0" />
                              <span>{a}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-5 border-t border-[#18352B]/10 flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <span className="text-xs text-[#58636B] block">Starting EP Rate (Room Only)</span>
                          <span className="font-display text-2xl font-semibold text-[#18352B] tabular-nums">
                            {formatCurrency(room.pricePerNight, settings.currency)}
                            <span className="text-xs font-sans font-normal text-[#58636B]"> / night</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button asChild variant="outline">
                            <Link to={`/rooms/${room.slug}`}>Room Details</Link>
                          </Button>
                          <Button asChild>
                            <Link
                              to={`/booking?roomId=${encodeURIComponent(room._id)}${
                                checkEnabled ? `&checkIn=${checkIn}&checkOut=${checkOut}` : ''
                              }`}
                            >
                              Request Stay
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Tariff Legend & Policy Reference from Official Brochure */}
          <div className="bg-[#E9E0D1]/55 rounded-lg border border-[#18352B]/12 p-6 sm:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="font-display text-2xl font-medium text-[#18352B]">
                Meal Plan & Extra Person Policy
              </h2>
              <span className="text-xs font-mono text-[#234638]">
                Extra Person: Applicable for guests above 12 years
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {MEAL_PLAN_CODES.map((code) => {
                const detail = MEAL_PLAN_DETAILS[code];
                return (
                  <div key={code} className="bg-white rounded-md p-4 border border-[#18352B]/10 space-y-1">
                    <p className="font-mono text-xs font-semibold text-[#234638]">{detail.title}</p>
                    <p className="text-xs text-[#58636B] leading-relaxed">{detail.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
