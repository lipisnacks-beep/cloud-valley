import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { usePublicData } from '../../context/SettingsContext';
import { SEOHead } from '../../components/shared/SEOHead';
import { Skeleton } from '../../components/ui/skeleton';

export function PolicyPage({ slug }: { slug: string }) {
  const { settings } = usePublicData();

  const pageQuery = useQuery({
    queryKey: ['public', 'page', slug],
    queryFn: () => api.getPageContent(slug),
  });

  const page = pageQuery.data;

  return (
    <>
      <SEOHead
        title={`${page?.title || 'Policy'} — ${settings.resortName}`}
        description={page?.subtitle || settings.seoDescription}
        canonicalPath={`/${slug}`}
      />

      <section className="py-16 sm:py-22 bg-[#F8F5EF]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {pageQuery.isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : page ? (
            <>
              <div className="space-y-2 border-b border-[#18352B]/12 pb-6">
                <p className="text-xs font-medium tracking-widest text-[#234638]">
                  Guest Policy
                </p>
                <h1 className="font-display text-3xl sm:text-4xl font-medium text-[#18352B]">
                  {page.title}
                </h1>
                {page.subtitle && <p className="text-sm text-[#58636B]">{page.subtitle}</p>}
              </div>
              <div className="bg-white rounded-lg border border-[#18352B]/12 p-6 sm:p-8 space-y-4">
                {page.body.split('\n\n').map((para, idx) => (
                  <p key={idx} className="text-sm text-[#18352B]/90 leading-relaxed whitespace-pre-line">
                    {para}
                  </p>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-[#58636B]">Policy information is currently unavailable.</p>
          )}
        </div>
      </section>
    </>
  );
}
