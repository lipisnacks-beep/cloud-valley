import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { api } from '../../services/api';
import { usePublicData } from '../../context/SettingsContext';
import { SEOHead } from '../../components/shared/SEOHead';
import { Skeleton } from '../../components/ui/skeleton';
import { FAQ_CATEGORIES } from '../../../shared/constants/index.ts';
import { cn } from '../../lib/utils';

export function FAQPage() {
  const { settings } = usePublicData();
  const [category, setCategory] = useState('All');
  const [openId, setOpenId] = useState<string | null>(null);

  const faqQuery = useQuery({
    queryKey: ['public', 'faqs'],
    queryFn: api.getFAQs,
  });

  const faqs = (faqQuery.data || []).filter((f) =>
    category === 'All' ? true : f.category === category
  );

  const faqSchema =
    faqs.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: f.answer,
            },
          })),
        }
      : undefined;

  return (
    <>
      <SEOHead
        title={`Frequently Asked Questions — ${settings.resortName} Samalbong`}
        description="Answers to common questions about booking requests, check-in timings, travel from Bagdogra/NJP, and dining at CLOUD VALLEY."
        canonicalPath="/faq"
        structuredData={faqSchema}
      />

      <section className="py-16 sm:py-22 bg-[#F8F5EF]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="space-y-3">
            <p className="text-xs font-medium tracking-widest text-[#234638]">
              Guest Guide
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-medium text-[#18352B]">
              Frequently Asked Questions
            </h1>
          </div>

          <div className="flex flex-wrap gap-1.5 p-1 bg-[#E9E0D1]/70 rounded-md w-fit">
            {['All', ...FAQ_CATEGORIES].map((cat) => (
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

          {faqQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((n) => (
                <Skeleton key={n} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-[#18352B]/12 divide-y divide-[#18352B]/10">
              {faqs.map((faq) => {
                const isOpen = openId === faq._id;
                return (
                  <div key={faq._id} className="p-5 sm:p-6">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenId(isOpen ? null : faq._id)}
                      className="w-full flex items-center justify-between gap-4 text-left"
                    >
                      <div>
                        <span className="text-xs text-[#58636B] block mb-1">{faq.category}</span>
                        <span className="font-display text-lg font-medium text-[#18352B]">
                          {faq.question}
                        </span>
                      </div>
                      <ChevronDown
                        className={cn(
                          'w-5 h-5 text-[#234638] shrink-0 transition-transform duration-150',
                          isOpen && 'rotate-180'
                        )}
                      />
                    </button>
                    {isOpen && (
                      <p className="mt-3 text-sm text-[#58636B] leading-relaxed">{faq.answer}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
