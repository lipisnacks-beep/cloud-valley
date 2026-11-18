import { Link } from 'react-router-dom';
import { usePublicData } from '../../context/SettingsContext';
import { ResilientImage } from '../../components/shared/ResilientImage';
import { SEOHead } from '../../components/shared/SEOHead';
import { Button } from '../../components/ui/button';
import { DEFAULT_IMAGES, RESORT_FACILITIES } from '../../../shared/constants/index.ts';

export function AboutPage() {
  const { settings, homeContent } = usePublicData();

  return (
    <>
      <SEOHead
        title={`About ${settings.resortName} — Samalbong Resort Story`}
        description="Greeting From Cloud Valley Resort, Samalbong — Kalimpong's only 3-star mountain retreat offering panoramic views of Mount Kanchenjunga from every room."
        canonicalPath="/about"
      />

      <section className="py-16 sm:py-22 bg-[#F8F5EF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Header Intro */}
          <div className="max-w-3xl space-y-4">
            <p className="text-xs font-medium tracking-widest text-[#234638]">
              Greeting From Cloud Valley Resort, Samalbong
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-medium text-[#18352B] leading-tight text-balance">
              {homeContent.aboutStoryTitle}
            </h1>
            <p className="text-base sm:text-lg text-[#58636B] leading-relaxed">
              {homeContent.aboutStoryBody}
            </p>
          </div>

          {/* Primary Story & Philosophy Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            <div className="lg:col-span-7 rounded-lg overflow-hidden border border-[#18352B]/10 h-80 sm:h-[460px]">
              <ResilientImage
                src={DEFAULT_IMAGES.resortBuilding}
                alt="Cloud Valley Resort three-story hillside property in Samalbong, Kalimpong"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="lg:col-span-5 bg-[#E9E0D1]/55 rounded-lg p-8 border border-[#18352B]/10 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <p className="text-xs font-medium tracking-widest text-[#234638]">
                  Where Mountains Whisper and Moments Stay Forever
                </p>
                <h2 className="font-display text-2xl font-medium text-[#18352B]">
                  Unwind... Explore... Experience Samalbong...
                </h2>
                <p className="text-sm text-[#58636B] leading-relaxed">
                  {homeContent.aboutPhilosophy}
                </p>
              </div>
              <div className="space-y-2.5 pt-4 border-t border-[#18352B]/10 text-xs sm:text-sm text-[#18352B]">
                <p><strong className="font-medium">Location:</strong> Samalbong Khasmahal (Sinji), ~21–30 km from Kalimpong town</p>
                <p><strong className="font-medium">Views:</strong> Clear morning views of Mount Kanchenjunga, rolling green hills & misty tea/orange gardens</p>
                <p><strong className="font-medium">Vibe:</strong> Ideal for slow travel, bird watching & nature walks away from crowded hubs</p>
                <p><strong className="font-medium">Best Time to Visit:</strong> October to March</p>
                <p><strong className="font-medium">Property Hosts:</strong> {settings.hosts || 'Joy Banerjee & Prasanta Das'}</p>
              </div>
            </div>
          </div>

          {/* 4 Brochure Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                num: '01',
                title: 'Breathtaking Kanchenjunga Views',
                body: 'Uninterrupted panoramic views of the full Mount Kanchenjunga range directly from every room and our dedicated view deck.',
              },
              {
                num: '02',
                title: 'Peaceful & Natural Surroundings',
                body: 'Surrounded by misty tea estates, orange gardens, and pine hills overlooking the Teesta River corridor.',
              },
              {
                num: '03',
                title: 'Perfect for Slow Travel',
                body: 'Bird watching, village trails, open-air tea/coffee sessions, and digital-detox tranquility away from crowded hubs.',
              },
              {
                num: '04',
                title: 'Family, Friends & Corporate Groups',
                body: '11 spacious rooms (9 Double Bedded + 2 Four Bedded) paired with a 50-seated conference room for group retreats.',
              },
            ].map((item) => (
              <div
                key={item.num}
                className="bg-white rounded-lg border border-[#18352B]/12 p-6 space-y-2.5"
              >
                <span className="font-mono text-xs font-semibold text-[#234638]">{item.num}</span>
                <h3 className="font-display text-xl font-medium text-[#18352B]">{item.title}</h3>
                <p className="text-xs text-[#58636B] leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>

          {/* All 8 Facilities & Conference Room Showcase */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center bg-white rounded-lg border border-[#18352B]/12 p-6 sm:p-10">
            <div className="lg:col-span-6 space-y-5">
              <p className="text-xs font-medium tracking-widest text-[#234638]">
                On-Property Facilities
              </p>
              <h2 className="font-display text-3xl font-medium text-[#18352B]">
                Eight dedicated facilities crafted for comfort & convenience.
              </h2>
              <ol className="space-y-2.5 text-sm text-[#18352B] divide-y divide-[#18352B]/10">
                {RESORT_FACILITIES.map((facility, idx) => (
                  <li key={facility} className="pt-2.5 first:pt-0 flex items-start gap-3">
                    <span className="font-mono text-xs font-semibold text-[#234638] pt-0.5 tabular-nums">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span>{facility}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <div className="aspect-[4/3] rounded-md overflow-hidden border border-[#18352B]/10">
                <ResilientImage
                  src={DEFAULT_IMAGES.conference}
                  alt="50 Seated Conference Room at Cloud Valley Resort"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-[4/3] rounded-md overflow-hidden border border-[#18352B]/10">
                <ResilientImage
                  src={DEFAULT_IMAGES.dining}
                  alt="In-house Multi-Cuisine Restaurant at Cloud Valley Resort"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-[4/3] rounded-md overflow-hidden border border-[#18352B]/10">
                <ResilientImage
                  src={DEFAULT_IMAGES.teaBar}
                  alt="Open-air tea and coffee bar facing Mount Kanchenjunga"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-[4/3] rounded-md overflow-hidden border border-[#18352B]/10">
                <ResilientImage
                  src={DEFAULT_IMAGES.hero}
                  alt="Cloud Valley courtyard and WE LOVE CLOUD VALLEY sign"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#234638] text-[#F8F5EF] rounded-lg p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <h2 className="font-display text-2xl sm:text-3xl font-medium">
                Corporate Tie-Ups & Samalbong Group Retreats
              </h2>
              <p className="text-sm text-[#F8F5EF]/80">
                Planning a corporate offsite or family gathering in Kalimpong? Connect with Joy Banerjee & Prasanta Das for tailored group room blocks and conference arrangements.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <Button asChild variant="accent">
                <Link to="/rooms">Explore Rooms & Tariff</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/30 text-white hover:bg-white/15 hover:text-white"
              >
                <Link to="/booking">Book Your Stay</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
