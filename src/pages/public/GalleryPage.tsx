import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { api } from '../../services/api';
import { usePublicData } from '../../context/SettingsContext';
import { ResilientImage } from '../../components/shared/ResilientImage';
import { SEOHead } from '../../components/shared/SEOHead';
import { Skeleton } from '../../components/ui/skeleton';
import { GALLERY_CATEGORIES } from '../../../shared/constants/index.ts';

interface LightboxMedia {
  title: string;
  category: string;
  imageUrl: string;
  alt: string;
}

export function GalleryPage() {
  const { settings } = usePublicData();
  const [category, setCategory] = useState<string>('All');
  const [selected, setSelected] = useState<LightboxMedia | null>(null);

  const galleryQuery = useQuery({
    queryKey: ['public', 'gallery'],
    queryFn: api.getGallery,
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const items = (galleryQuery.data || []).filter((g) =>
    category === 'All' ? true : g.category === category
  );

  return (
    <>
      <SEOHead
        title={`Photo Gallery — ${settings.resortName} Samalbong`}
        description="Explore photographs of Cloud Valley Resort rooms, Mount Kanchenjunga sunrises, 50-seated conference hall, multi-cuisine dining, and Kalimpong sightseeing spots."
        canonicalPath="/gallery"
      />

      <section className="py-16 sm:py-22 bg-[#F8F5EF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
              <div className="space-y-2 max-w-2xl">
                <p className="text-xs font-medium tracking-widest text-[#234638]">
                  Visual Journal
                </p>
                <h1 className="font-display text-4xl sm:text-5xl font-medium text-[#18352B]">
                  Cloud Valley Resort & Samalbong Views
                </h1>
              </div>

              <div className="flex flex-wrap gap-1.5 p-1 bg-[#E9E0D1]/70 rounded-md">
                {['All', ...GALLERY_CATEGORIES].map((cat) => (
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

            {galleryQuery.isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <Skeleton key={n} className="aspect-[4/3] w-full" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="bg-white p-12 rounded-lg border border-[#18352B]/10 text-center text-sm text-[#58636B]">
                No photographs available in this category yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() =>
                      setSelected({
                        title: item.title,
                        category: item.category,
                        imageUrl: item.imageUrl,
                        alt: item.alt,
                      })
                    }
                    className="group bg-white rounded-lg overflow-hidden border border-[#18352B]/10 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#234638]"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-[#E9E0D1]">
                      <ResilientImage
                        src={item.imageUrl}
                        alt={item.alt}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-[#58636B]">{item.category}</p>
                      <p className="font-display text-lg text-[#18352B] mt-0.5">{item.title}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSelected(null)}
          className="fixed inset-0 z-50 bg-[#18352B]/90 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-[#F8F5EF] rounded-lg overflow-hidden shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Close image"
              className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-[#18352B]/85 text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
            <ResilientImage
              src={selected.imageUrl}
              alt={selected.alt}
              className="w-full max-h-[75vh] object-contain bg-[#18352B]"
            />
            <div className="p-5">
              <p className="text-xs text-[#58636B]">{selected.category}</p>
              <h2 className="font-display text-xl text-[#18352B]">{selected.title}</h2>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
