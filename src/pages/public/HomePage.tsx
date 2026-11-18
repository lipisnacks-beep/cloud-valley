import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Building2,
  Car,
  Compass,
  MapPin,
  MessageCircle,
  Mountain,
  Star,
  Utensils,
  X,
} from 'lucide-react';
import { api } from '../../services/api';
import { usePublicData } from '../../context/SettingsContext';
import { BookingWidget } from '../../components/booking/BookingWidget';
import { ResilientImage } from '../../components/shared/ResilientImage';
import { SEOHead } from '../../components/shared/SEOHead';
import { Skeleton } from '../../components/ui/skeleton';
import { Button } from '../../components/ui/button';
import { buildWhatsAppUrl, formatCurrency } from '../../lib/utils';
import { DEFAULT_IMAGES, RESORT_FACILITIES } from '../../../shared/constants/index.ts';
import type { GalleryItem } from '../../../shared/types/index.ts';

export function HomePage() {
  const { settings, homeContent, rooms, isLoading } = usePublicData();
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);

  const galleryQuery = useQuery({
    queryKey: ['public', 'gallery'],
    queryFn: api.getGallery,
  });
  const experiencesQuery = useQuery({
    queryKey: ['public', 'experiences'],
    queryFn: api.getExperiences,
  });
  const diningQuery = useQuery({
    queryKey: ['public', 'dining'],
    queryFn: api.getDining,
  });
  const reviewsQuery = useQuery({
    queryKey: ['public', 'reviews'],
    queryFn: api.getReviews,
  });

  const featuredRooms = rooms.filter((r) => r.isFeatured).slice(0, 3);
  const displayRooms = featuredRooms.length > 0 ? featuredRooms : rooms.slice(0, 3);
  const galleryPreview = (galleryQuery.data || []).slice(0, 6);
  const experiences = (experiencesQuery.data || []).slice(0, 6);
  const diningItems = (diningQuery.data || []).slice(0, 3);
  const reviews = (reviewsQuery.data || []).slice(0, 3);

  const whatsappUrl = buildWhatsAppUrl(
    settings.whatsapp,
    `Hello ${settings.resortName}, I would like to plan a stay at Samalbong.`
  );

  const resortSchema = {
    '@context': 'https://schema.org',
    '@type': 'Resort',
    name: settings.resortName,
    description: settings.seoDescription,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Samalbong Khasmahal (Sinji)',
      addressLocality: 'Kalimpong',
      addressRegion: 'West Bengal',
      postalCode: '734319',
      addressCountry: 'IN',
    },
    telephone: settings.phone,
    email: settings.email,
    url: window.location.origin,
  };

  return (
    <>
      <SEOHead
        title={settings.seoTitle}
        description={settings.seoDescription}
        canonicalPath="/"
        structuredData={resortSchema}
      />

      {/* Section 1: Cinematic Full-Width Hero */}
      <section className="relative min-h-[88vh] flex flex-col justify-end pb-10 sm:pb-14 pt-28 overflow-hidden bg-[#18352B]">
        <ResilientImage
          src={homeContent.heroImageUrl}
          alt="Cloud Valley Resort courtyard and WE LOVE CLOUD VALLEY sign in Samalbong, Kalimpong"
          loading="eager"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#18352B]/92 via-[#18352B]/50 to-[#18352B]/35"
        />

        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl space-y-4 text-[#F8F5EF]"
          >
            <p className="text-xs sm:text-sm tracking-widest text-[#C6A66B] font-medium">
              Samalbong Khasmahal (Sinji) · 21–30 km from Kalimpong · 3-Star Property
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-medium leading-[1.08] tracking-tight text-balance">
              {homeContent.heroHeadline}
            </h1>
            <p className="text-base sm:text-lg text-[#F8F5EF]/88 max-w-2xl leading-relaxed">
              {homeContent.heroSubtitle}
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3.5">
              <Button asChild variant="accent" size="lg">
                <Link to="/booking">Book Your Stay</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-[#F8F5EF]/40 text-[#F8F5EF] hover:bg-white/15 hover:text-white"
              >
                <Link to="/rooms">View Room Tariff (EP – AP)</Link>
              </Button>
            </div>
          </motion.div>

          {/* Hero Booking Widget */}
          <BookingWidget variant="hero" />
        </div>
      </section>

      {/* Section 2: Welcome to CLOUD VALLEY */}
      <section id="welcome-story" className="py-18 sm:py-24 bg-[#F8F5EF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <p className="text-xs font-medium tracking-widest text-[#234638]">
                01. Welcome to Cloud Valley Resort, Samalbong
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-medium text-[#18352B] leading-tight text-balance">
                {homeContent.welcomeTitle}
              </h2>
              <p className="text-base text-[#58636B] leading-relaxed">
                {homeContent.welcomeBody}
              </p>
              <div className="grid grid-cols-3 gap-6 pt-4 border-t border-[#18352B]/12">
                <div>
                  <p className="font-display text-2xl font-semibold text-[#18352B] tabular-nums">
                    11 Rooms
                  </p>
                  <p className="text-xs text-[#58636B] mt-1">9 Double · 2 Four-Bed</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-semibold text-[#18352B] tabular-nums">
                    50 Seated
                  </p>
                  <p className="text-xs text-[#58636B] mt-1">Conference Room</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-semibold text-[#18352B]">
                    Oct – Mar
                  </p>
                  <p className="text-xs text-[#58636B] mt-1">Best Time to Visit</p>
                </div>
              </div>
              <div className="pt-2 flex flex-wrap items-center gap-6">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#234638] hover:text-[#18352B] border-b border-[#234638]/40 pb-1 transition-colors"
                >
                  <span>Explore Resort Overview</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/gallery"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#58636B] hover:text-[#18352B] border-b border-[#18352B]/20 pb-1 transition-colors"
                >
                  <span>View Official Brochure Sheets</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="h-80 sm:h-[460px] lg:h-full rounded-lg overflow-hidden border border-[#18352B]/10">
                <ResilientImage
                  src={homeContent.welcomeImageUrl}
                  alt="Cloud Valley Resort three-story hillside wing and courtyard terrace in Samalbong"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Accommodation & Meal Plan Tariffs */}
      <section className="py-18 sm:py-24 bg-[#E9E0D1]/45 border-y border-[#18352B]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-medium tracking-widest text-[#234638]">
                02. Accommodation & Tariff Schedule
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-medium text-[#18352B] text-balance">
                9 Double Bedded & 2 Four Bedded rooms — full Kanchenjunga range from every room.
              </h2>
            </div>
            <Button asChild variant="outline">
              <Link to="/rooms">Compare EP / CP / MAP / AP Rates</Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} className="h-[420px] w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
              {displayRooms.map((room) => (
                <article
                  key={room._id}
                  className="bg-white rounded-lg overflow-hidden border border-[#18352B]/10 flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <div>
                    <div className="aspect-[4/3] overflow-hidden bg-[#E9E0D1]">
                      <ResilientImage
                        src={room.images[0]?.url}
                        alt={room.images[0]?.alt || room.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    </div>
                    <div className="p-6 space-y-3">
                      <div className="text-xs text-[#58636B] flex flex-wrap items-center gap-1.5 tabular-nums">
                        <span>{room.totalUnits} Rooms</span>
                        <span aria-hidden="true">·</span>
                        <span>Up to {room.maxGuests} Guests</span>
                        {room.viewType && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>Kanchenjunga View</span>
                          </>
                        )}
                      </div>
                      <h3 className="font-display text-2xl font-medium text-[#18352B]">
                        {room.name}
                      </h3>
                      <p className="text-sm text-[#58636B] leading-relaxed line-clamp-2">
                        {room.shortDescription}
                      </p>

                      {room.mealPlans && room.mealPlans.length > 0 && (
                        <div className="grid grid-cols-4 gap-1.5 pt-2 text-center border-t border-[#18352B]/10">
                          {room.mealPlans.map((plan) => (
                            <div key={plan.code} className="py-1.5 rounded bg-[#F8F5EF]">
                              <p className="font-mono text-[10px] font-semibold text-[#234638]">
                                {plan.code}
                              </p>
                              <p className="font-mono text-xs font-medium text-[#18352B] tabular-nums">
                                {formatCurrency(plan.roomRate, settings.currency)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-6 py-4 border-t border-[#18352B]/10 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-[#58636B] block">Starting EP Tariff</span>
                      <span className="font-display text-lg font-semibold text-[#18352B] tabular-nums">
                        {formatCurrency(room.pricePerNight, settings.currency)}
                        <span className="text-xs font-sans font-normal text-[#58636B]"> / night</span>
                      </span>
                    </div>
                    <Button asChild size="sm">
                      <Link to={`/rooms/${room.slug}`}>View Room</Link>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Section 4: 8 Core Resort Facilities & 50-Seated Conference Room */}
      <section className="py-18 sm:py-24 bg-[#234638] text-[#F8F5EF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-5">
              <p className="text-xs font-medium tracking-widest text-[#C6A66B]">
                03. Resort Facilities & Corporate Retreats
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-medium text-balance">
                Thoughtful 3-star amenities for families, friends, and corporate groups.
              </h2>
              <p className="text-sm sm:text-base text-[#F8F5EF]/80 leading-relaxed">
                Samalbong’s only 3-star property pairs panoramic Himalayan rooms with an in-house multi-cuisine restaurant, an open-air tea/coffee bar, and a dedicated 50-seated conference room for corporate tie-ups and team offsites.
              </p>

              <ol className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {RESORT_FACILITIES.map((facility, idx) => (
                  <li
                    key={facility}
                    className="p-3.5 rounded-md border border-white/15 bg-[#18352B]/55 flex items-start gap-2.5 text-xs leading-relaxed"
                  >
                    <span className="font-mono text-[#C6A66B] font-semibold tabular-nums shrink-0">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[#F8F5EF]/90">{facility}</span>
                  </li>
                ))}
              </ol>

              <div className="pt-2 flex flex-wrap gap-3">
                <Button asChild variant="accent">
                  <Link to="/contact?subject=Corporate%20Tie-Up%20%26%20Group%20Inquiry">
                    <Building2 className="w-4 h-4" />
                    <span>Corporate Tie-Ups Inquiry</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-white/30 text-[#F8F5EF] hover:bg-white/15 hover:text-white"
                >
                  <Link to="/about">Explore All Highlights</Link>
                </Button>
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <div className="aspect-[4/3] rounded-lg overflow-hidden border border-white/15">
                <ResilientImage
                  src={DEFAULT_IMAGES.conference}
                  alt="50-seated conference room for corporate offsites at Cloud Valley Resort"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-[4/3] rounded-lg overflow-hidden border border-white/15">
                <ResilientImage
                  src={DEFAULT_IMAGES.teaBar}
                  alt="Open-air tea and coffee seating overlooking Mount Kanchenjunga"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-[4/3] rounded-lg overflow-hidden border border-white/15">
                <ResilientImage
                  src={DEFAULT_IMAGES.kanchenjungaSunrise}
                  alt="Clear morning sunrise on Mount Kanchenjunga from Samalbong"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-[4/3] rounded-lg overflow-hidden border border-white/15">
                <ResilientImage
                  src={DEFAULT_IMAGES.balcony}
                  alt="Resort balcony corridor looking toward Kalimpong hills"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Dining & Multi-Cuisine Restaurant */}
      <section className="py-18 sm:py-24 bg-[#F8F5EF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="h-80 sm:h-[440px] lg:h-full rounded-lg overflow-hidden border border-[#18352B]/10">
                <ResilientImage
                  src={homeContent.diningImageUrl}
                  alt="In-house multi-cuisine restaurant dining hall at Cloud Valley Resort"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="lg:col-span-6 order-1 lg:order-2 flex flex-col justify-center space-y-6">
              <p className="text-xs font-medium tracking-widest text-[#234638]">
                04. Dining & Open-Air Tea / Coffee Bar
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-medium text-[#18352B] text-balance">
                {homeContent.diningTitle}
              </h2>
              <p className="text-base text-[#58636B] leading-relaxed">
                {homeContent.diningSubtitle}
              </p>

              <div className="divide-y divide-[#18352B]/10 border-y border-[#18352B]/10">
                {diningItems.map((item) => (
                  <div key={item._id} className="py-4 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-sm text-[#18352B]">{item.title}</h3>
                      <p className="text-xs text-[#58636B] mt-0.5 line-clamp-2">{item.description}</p>
                    </div>
                    {item.timing && (
                      <span className="text-xs font-mono text-[#234638] whitespace-nowrap shrink-0 tabular-nums">
                        {item.timing}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <Button asChild variant="outline">
                  <Link to="/dining" className="inline-flex items-center gap-2">
                    <Utensils className="w-4 h-4" />
                    <span>Explore Dining & Meal Plans</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: 9 Sightseeing Destinations Covered from Property */}
      <section className="py-18 sm:py-24 bg-[#E9E0D1]/45 border-t border-[#18352B]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-medium tracking-widest text-[#234638]">
                05. Sightseeing Covered from Property
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-medium text-[#18352B] text-balance">
                {homeContent.experienceTitle}
              </h2>
              <p className="text-sm text-[#58636B]">{homeContent.experienceSubtitle}</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/experiences" className="inline-flex items-center gap-2">
                <Compass className="w-4 h-4" />
                <span>All 9 Sightseeing Spots</span>
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {experiences.map((exp) => (
              <div
                key={exp._id}
                className="bg-white rounded-lg overflow-hidden border border-[#18352B]/10 flex flex-col"
              >
                <div className="aspect-[4/3] overflow-hidden bg-[#E9E0D1]">
                  <ResilientImage
                    src={exp.images[0]?.url}
                    alt={exp.images[0]?.alt || exp.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <p className="text-xs text-[#58636B]">
                      {exp.category} {exp.duration ? `· ${exp.duration}` : ''}
                    </p>
                    <h3 className="font-display text-lg font-medium text-[#18352B]">
                      {exp.title}
                    </h3>
                    <p className="text-xs text-[#58636B] leading-relaxed line-clamp-3">
                      {exp.description}
                    </p>
                  </div>
                  <p className="text-xs text-[#234638] font-medium pt-3">
                    {exp.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 7: Photo Gallery Preview with Lightbox */}
      <section className="py-18 sm:py-24 bg-[#F8F5EF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-medium tracking-widest text-[#234638]">
                06. Visual Journal & Official Brochure
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-medium text-[#18352B]">
                Real views from Cloud Valley Resort, Samalbong
              </h2>
            </div>
            <Button asChild variant="outline">
              <Link to="/gallery">Open Gallery & Brochure Sheets</Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {galleryPreview.map((item) => (
              <button
                key={item._id}
                type="button"
                onClick={() => setLightboxItem(item)}
                className="group relative aspect-[4/3] rounded-lg overflow-hidden border border-[#18352B]/10 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#234638]"
              >
                <ResilientImage
                  src={item.imageUrl}
                  alt={item.alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 p-3.5 bg-gradient-to-t from-[#18352B]/85 to-transparent text-[#F8F5EF] opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs text-[#C6A66B]">{item.category}</p>
                  <p className="text-sm font-medium truncate">{item.title}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Section 8: Guest Testimonials */}
      {reviews.length > 0 && (
        <section className="py-18 sm:py-24 bg-[#E9E0D1]/45 border-y border-[#18352B]/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-medium tracking-widest text-[#234638]">
                07. Guest Reflections
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-medium text-[#18352B]">
                Words from travelers who stayed overlooking Mount Kanchenjunga.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
              {reviews.map((rev) => (
                <blockquote
                  key={rev._id}
                  className="bg-white p-6 rounded-lg border border-[#18352B]/10 flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-1 text-[#C6A66B]" aria-label={`${rev.rating} out of 5 stars`}>
                      {Array.from({ length: rev.rating }).map((_, idx) => (
                        <Star key={idx} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm text-[#18352B] leading-relaxed">“{rev.comment}”</p>
                  </div>
                  <footer className="pt-4 border-t border-[#18352B]/10 text-xs text-[#58636B]">
                    <p className="font-semibold text-[#18352B]">{rev.guestName}</p>
                    <p>
                      {[rev.guestLocation, rev.stayDate, rev.sourceLabel].filter(Boolean).join(' · ')}
                    </p>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Section 9: Location & Map */}
      <section className="py-18 sm:py-24 bg-[#F8F5EF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            <div className="lg:col-span-5 flex flex-col justify-center space-y-5">
              <p className="text-xs font-medium tracking-widest text-[#234638]">
                08. Getting to Samalbong Khasmahal (Sinji)
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-medium text-[#18352B]">
                Serene Kalimpong hills with private parking & driver accommodation.
              </h2>
              <p className="text-sm text-[#58636B] leading-relaxed">
                {settings.address}
              </p>
              <ul className="space-y-2.5 text-sm text-[#18352B] border-t border-[#18352B]/10 pt-4">
                <li className="flex justify-between">
                  <span className="text-[#58636B]">Kalimpong Town</span>
                  <span className="font-mono text-xs tabular-nums">~21–30 km drive</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-[#58636B]">Best Season</span>
                  <span className="font-mono text-xs">October – March</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-[#58636B] flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-[#234638]" />
                    <span>Own Parking & Driver Stay</span>
                  </span>
                  <span className="font-mono text-xs">Available On-Site</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-[#58636B] flex items-center gap-1.5">
                    <Mountain className="w-3.5 h-3.5 text-[#234638]" />
                    <span>Property Hosts</span>
                  </span>
                  <span className="font-medium text-xs">{settings.hosts || 'Joy Banerjee & Prasanta Das'}</span>
                </li>
              </ul>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild variant="default">
                  <Link to="/location" className="inline-flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>Directions & Arrival Guide</span>
                  </Link>
                </Button>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="h-80 sm:h-[400px] rounded-lg overflow-hidden border border-[#18352B]/15 bg-[#E9E0D1]">
                <iframe
                  title="Cloud Valley Resort Samalbong Map"
                  src={settings.googleMapsEmbedUrl}
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 10: Booking & Corporate Tie-Up CTA Banner */}
      <section className="py-18 sm:py-24 bg-[#18352B] text-[#F8F5EF]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <p className="text-xs font-medium tracking-widest text-[#C6A66B]">
            Reservations & Corporate Tie-Ups
          </p>
          <h2 className="font-display text-3xl sm:text-5xl font-medium text-balance">
            {homeContent.ctaTitle}
          </h2>
          <p className="text-base text-[#F8F5EF]/80 max-w-2xl mx-auto leading-relaxed">
            {homeContent.ctaSubtitle}
          </p>
          <div className="pt-3 flex flex-wrap items-center justify-center gap-4">
            <Button asChild variant="accent" size="lg">
              <Link to="/booking">Submit Booking Request</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-[#F8F5EF]/35 text-[#F8F5EF] hover:bg-white/15 hover:text-white"
            >
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#C6A66B]" />
                <span>WhatsApp ({settings.phone})</span>
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Interactive Lightbox Modal */}
      {lightboxItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lightboxItem.title}
          onClick={() => setLightboxItem(null)}
          className="fixed inset-0 z-50 bg-[#18352B]/90 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-[#F8F5EF] rounded-lg overflow-hidden shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setLightboxItem(null)}
              aria-label="Close lightbox"
              className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-[#18352B]/80 text-white flex items-center justify-center hover:bg-[#18352B]"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="max-h-[75vh] overflow-hidden bg-[#18352B]">
              <ResilientImage
                src={lightboxItem.imageUrl}
                alt={lightboxItem.alt}
                className="w-full max-h-[75vh] object-contain mx-auto"
              />
            </div>
            <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-[#58636B]">{lightboxItem.category}</p>
                <p className="font-display text-lg font-medium text-[#18352B]">{lightboxItem.title}</p>
              </div>
              <Link
                to="/gallery"
                className="text-xs font-medium text-[#234638] hover:underline whitespace-nowrap"
              >
                View All Photos
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
