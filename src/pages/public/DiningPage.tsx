import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { usePublicData } from '../../context/SettingsContext';
import { ResilientImage } from '../../components/shared/ResilientImage';
import { SEOHead } from '../../components/shared/SEOHead';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { MEAL_PLAN_CODES, MEAL_PLAN_DETAILS } from '../../../shared/constants/index.ts';

export function DiningPage() {
  const { settings, homeContent } = usePublicData();

  const diningQuery = useQuery({
    queryKey: ['public', 'dining'],
    queryFn: api.getDining,
  });

  return (
    <>
      <SEOHead
        title={`Multi-Cuisine Dining & Tea Bar — ${settings.resortName} Samalbong`}
        description="In-house multi-cuisine restaurant and open-air tea/coffee bar overlooking Mount Kanchenjunga at Cloud Valley Resort, Samalbong."
        canonicalPath="/dining"
      />

      <section className="py-16 sm:py-22 bg-[#F8F5EF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center space-y-4">
              <p className="text-xs font-medium tracking-widest text-[#234638]">
                In-House Multi-Cuisine Restaurant & Open-Air Tea / Coffee Bar
              </p>
              <h1 className="font-display text-4xl sm:text-5xl font-medium text-[#18352B] text-balance">
                {homeContent.diningTitle}
              </h1>
              <p className="text-base text-[#58636B] leading-relaxed">
                {homeContent.diningSubtitle}
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <Button asChild>
                  <Link to="/booking">Book With Meal Plan</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/rooms">View Room & Meal Rates</Link>
                </Button>
              </div>
            </div>

            <div className="lg:col-span-6 h-80 sm:h-[400px] rounded-lg overflow-hidden border border-[#18352B]/12">
              <ResilientImage
                src={homeContent.diningImageUrl}
                alt="In-house multi-cuisine dining hall at Cloud Valley Resort, Samalbong"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {diningQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} className="h-80 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
              {(diningQuery.data || []).map((item) => (
                <article
                  key={item._id}
                  className="bg-white rounded-lg border border-[#18352B]/12 overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-[4/3] overflow-hidden bg-[#E9E0D1]">
                      <ResilientImage
                        src={item.imageUrl}
                        alt={item.alt}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-6 space-y-2.5">
                      <p className="text-xs text-[#58636B]">
                        {[item.category, item.timing].filter(Boolean).join(' · ')}
                      </p>
                      <h2 className="font-display text-2xl font-medium text-[#18352B]">
                        {item.title}
                      </h2>
                      <p className="text-sm text-[#58636B] leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  {item.dietaryNote && (
                    <div className="px-6 py-3.5 border-t border-[#18352B]/10 text-xs text-[#234638]">
                      {item.dietaryNote}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}

          {/* Brochure Meal Plan Reference */}
          <div className="bg-[#E9E0D1]/55 rounded-lg border border-[#18352B]/12 p-6 sm:p-8 space-y-4">
            <h2 className="font-display text-2xl font-medium text-[#18352B]">
              Flexible Meal Plans (EP / CP / MAP / AP)
            </h2>
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
