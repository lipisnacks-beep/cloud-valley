import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { usePublicData } from '../../context/SettingsContext';
import { ResilientImage } from '../../components/shared/ResilientImage';
import { SEOHead } from '../../components/shared/SEOHead';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { EXPERIENCE_CATEGORIES } from '../../../shared/constants/index.ts';

export function ExperiencesPage() {
  const { settings } = usePublicData();
  const [category, setCategory] = useState('All');

  const expQuery = useQuery({
    queryKey: ['public', 'experiences'],
    queryFn: api.getExperiences,
  });

  const items = (expQuery.data || []).filter((e) =>
    category === 'All' ? true : e.category === category
  );

  return (
    <>
      <SEOHead
        title={`Sightseeing Covered from Property — ${settings.resortName} Samalbong`}
        description="Explore Lava View Point, Lolegaon, Rishop, Panbu View Point, Dubling View Point, Ramdhura, Moonsung, Pala Waterfall & Kalimpong from Cloud Valley Resort."
        canonicalPath="/experiences"
      />

      <section className="py-16 sm:py-22 bg-[#F8F5EF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
            <div className="space-y-3 max-w-2xl">
              <p className="text-xs font-medium tracking-widest text-[#234638]">
                Sightseeing Covered From Property · Best Time: Oct – Mar
              </p>
              <h1 className="font-display text-4xl sm:text-5xl font-medium text-[#18352B] text-balance">
                Nine Kalimpong viewpoints, forests & waterfalls from Samalbong.
              </h1>
              <p className="text-sm sm:text-base text-[#58636B]">
                Lava, Lolegaon, Rishop, Panbu View Point, Dubling View Point, Ramdhura, Moonsung, Pala Waterfall & Suicide Point, plus Kalimpong heritage spots (Delo Park, Golf Course, Science City & Pine View Nursery).
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 p-1 bg-[#E9E0D1]/70 rounded-md self-start md:self-auto">
              {['All', ...EXPERIENCE_CATEGORIES].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3.5 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                    category === cat
                      ? 'bg-white text-[#18352B] shadow-xs'
                      : 'text-[#58636B] hover:text-[#18352B]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {expQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <Skeleton key={n} className="h-80 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-lg border border-[#18352B]/10 p-10 text-center space-y-3">
              <p className="text-sm text-[#58636B]">No sightseeing excursions listed in this filter.</p>
              <Button variant="outline" size="sm" onClick={() => setCategory('All')}>
                Show All Sightseeing Spots
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {items.map((exp) => (
                <article
                  key={exp._id}
                  className="bg-white rounded-lg border border-[#18352B]/12 overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-[4/3] overflow-hidden bg-[#E9E0D1]">
                      <ResilientImage
                        src={exp.images[0]?.url}
                        alt={exp.images[0]?.alt || exp.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-6 space-y-2.5">
                      <p className="text-xs text-[#58636B]">
                        {[exp.category, exp.location, exp.duration].filter(Boolean).join(' · ')}
                      </p>
                      <h2 className="font-display text-2xl font-medium text-[#18352B]">
                        {exp.title}
                      </h2>
                      <p className="text-sm text-[#58636B] leading-relaxed">{exp.description}</p>
                    </div>
                  </div>

                  <div className="px-6 py-4 border-t border-[#18352B]/10 flex flex-wrap items-center justify-between gap-2 text-xs text-[#58636B]">
                    <span>{exp.bestTime ? `Best time: ${exp.bestTime}` : ''}</span>
                    <span>{exp.distance || ''}</span>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="bg-[#E9E0D1]/60 rounded-lg p-8 border border-[#18352B]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl text-[#18352B]">
                Local sightseeing cabs & driver accommodation on property
              </h2>
              <p className="text-sm text-[#58636B] mt-1">
                Bringing your own vehicle? We offer dedicated private parking and on-site driver accommodation, or can arrange local Kalimpong sightseeing cars on request.
              </p>
            </div>
            <Button asChild>
              <Link to="/booking">Plan Your Stay</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
