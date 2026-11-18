import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Check } from 'lucide-react';
import { api } from '../../services/api';
import { usePublicData } from '../../context/SettingsContext';
import { ResilientImage } from '../../components/shared/ResilientImage';
import { SEOHead } from '../../components/shared/SEOHead';
import { BookingWidget } from '../../components/booking/BookingWidget';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { formatCurrency } from '../../lib/utils';
import type { MealPlanCode } from '../../../shared/types/index.ts';

export function RoomDetailPage() {
  const { slug = '' } = useParams();
  const { settings } = usePublicData();
  const [activeImage, setActiveImage] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<MealPlanCode>('EP');

  const roomQuery = useQuery({
    queryKey: ['public', 'room', slug],
    queryFn: () => api.getRoomBySlug(slug),
    enabled: Boolean(slug),
  });

  if (roomQuery.isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[460px] w-full" />
      </div>
    );
  }

  if (roomQuery.isError || !roomQuery.data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4">
        <h1 className="font-display text-3xl text-[#18352B]">Room Not Found</h1>
        <p className="text-sm text-[#58636B]">
          The requested accommodation category may have been updated or moved.
        </p>
        <Button asChild>
          <Link to="/rooms">Browse All Rooms</Link>
        </Button>
      </div>
    );
  }

  const room = roomQuery.data;
  const images = room.images.length > 0 ? room.images : [{ url: '', alt: room.name }];
  const planObj = room.mealPlans?.find((p) => p.code === selectedPlan);
  const activeNightlyRate = planObj ? planObj.roomRate : room.pricePerNight;

  return (
    <>
      <SEOHead
        title={`${room.name} — ${settings.resortName} Samalbong`}
        description={room.shortDescription}
        canonicalPath={`/rooms/${room.slug}`}
      />

      <section className="py-12 sm:py-16 bg-[#F8F5EF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <Link
            to="/rooms"
            className="inline-flex items-center gap-2 text-xs font-medium text-[#58636B] hover:text-[#18352B]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Rooms & Tariff</span>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Gallery Column */}
            <div className="lg:col-span-7 space-y-4">
              <div className="aspect-[4/3] rounded-lg overflow-hidden border border-[#18352B]/12 bg-[#E9E0D1]">
                <ResilientImage
                  src={images[activeImage]?.url}
                  alt={images[activeImage]?.alt || room.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImage(i)}
                      className={`aspect-[4/3] rounded-md overflow-hidden border-2 transition-colors ${
                        activeImage === i ? 'border-[#234638]' : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                    >
                      <ResilientImage
                        src={img.url}
                        alt={img.alt || `${room.name} thumbnail ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details Column */}
            <div className="lg:col-span-5 space-y-6 bg-white p-6 sm:p-8 rounded-lg border border-[#18352B]/12">
              <div className="space-y-2">
                <p className="text-xs text-[#58636B] tabular-nums">
                  {[
                    `Up to ${room.maxGuests} Guests`,
                    room.roomSize,
                    room.bedType,
                    `${room.totalUnits} Rooms Available`,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                <h1 className="font-display text-3xl sm:text-4xl font-medium text-[#18352B]">
                  {room.name}
                </h1>
                {room.viewType && (
                  <p className="text-xs font-medium text-[#234638]">View: {room.viewType}</p>
                )}
              </div>

              <p className="text-sm text-[#58636B] leading-relaxed">{room.description}</p>

              {/* Meal Plan Interactive Selector */}
              {room.mealPlans && room.mealPlans.length > 0 && (
                <div className="pt-4 border-t border-[#18352B]/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-semibold tracking-wider text-[#18352B]">
                      Select Meal Plan
                    </h2>
                    <span className="text-[11px] text-[#58636B]">Extra person (&gt;12 yrs)</span>
                  </div>
                  <div className="space-y-2">
                    {room.mealPlans.map((plan) => {
                      const active = selectedPlan === plan.code;
                      return (
                        <button
                          key={plan.code}
                          type="button"
                          onClick={() => setSelectedPlan(plan.code)}
                          className={`w-full text-left px-3.5 py-2.5 rounded-md border transition-colors flex items-center justify-between gap-3 ${
                            active
                              ? 'border-[#234638] bg-[#234638]/5'
                              : 'border-[#18352B]/12 hover:border-[#234638]/40'
                          }`}
                        >
                          <div>
                            <p className="text-xs font-semibold text-[#18352B]">
                              <span className="font-mono text-[#234638] mr-1.5">{plan.code}</span>
                              {plan.label}
                            </p>
                            <p className="text-[11px] text-[#58636B]">{plan.description}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-mono text-sm font-semibold text-[#18352B] tabular-nums">
                              {formatCurrency(plan.roomRate, settings.currency)}
                            </p>
                            <p className="font-mono text-[11px] text-[#58636B] tabular-nums">
                              +{formatCurrency(plan.extraPersonRate, settings.currency)} extra
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-[#18352B]/10 space-y-3">
                <h2 className="text-xs font-semibold tracking-wider text-[#18352B]">
                  Included Amenities
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {room.amenities.map((amenity) => (
                    <div key={amenity} className="flex items-center gap-2 text-xs text-[#18352B]">
                      <Check className="w-3.5 h-3.5 text-[#234638] shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-5 border-t border-[#18352B]/10 flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#58636B] block">
                    {planObj ? `${planObj.code} Nightly Rate` : 'Nightly Rate'}
                  </span>
                  <span className="font-display text-2xl font-semibold text-[#18352B] tabular-nums">
                    {formatCurrency(activeNightlyRate, settings.currency)}
                  </span>
                </div>
                <Button asChild size="lg">
                  <Link
                    to={`/booking?roomId=${encodeURIComponent(room._id)}&mealPlan=${selectedPlan}`}
                  >
                    Book This Room
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Inline Availability Bar */}
          <div className="space-y-3 pt-4">
            <h2 className="font-display text-2xl text-[#18352B]">
              Check dates for {room.name}
            </h2>
            <BookingWidget variant="surface" defaultRoomId={room._id} />
          </div>
        </div>
      </section>
    </>
  );
}
