import { ExternalLink, MapPin } from 'lucide-react';
import { usePublicData } from '../../context/SettingsContext';
import { SEOHead } from '../../components/shared/SEOHead';
import { Button } from '../../components/ui/button';

export function LocationPage() {
  const { settings } = usePublicData();

  return (
    <>
      <SEOHead
        title={`Location & Directions — ${settings.resortName} Samalbong`}
        description="Directions to Cloud Valley Resort in Samalbong Khasmahal (Sinji), roughly 21–30 km from Kalimpong town, West Bengal."
        canonicalPath="/location"
      />

      <section className="py-16 sm:py-22 bg-[#F8F5EF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-medium tracking-widest text-[#234638]">
              Location & Access · Best Time: October to March
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-medium text-[#18352B]">
              Finding Cloud Valley Resort in Samalbong Khasmahal (Sinji)
            </h1>
            <p className="text-base text-[#58636B] leading-relaxed">
              {settings.address}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-7 h-96 lg:h-[480px] rounded-lg overflow-hidden border border-[#18352B]/15 bg-[#E9E0D1]">
              <iframe
                title="Cloud Valley Resort Samalbong Location Map"
                src={settings.googleMapsEmbedUrl}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="lg:col-span-5 bg-white rounded-lg border border-[#18352B]/12 p-7 flex flex-col justify-between space-y-6">
              <div className="space-y-5">
                <h2 className="font-display text-2xl font-medium text-[#18352B]">
                  Travel & Property Arrival Info
                </h2>
                <div className="space-y-4 text-sm divide-y divide-[#18352B]/10">
                  <div className="pt-2">
                    <p className="font-medium text-[#18352B]">From Kalimpong Town</p>
                    <p className="text-[#58636B] mt-1">
                      Roughly 21–30 km from Kalimpong town into peaceful Samalbong Khasmahal (Sinji), nestled amidst rolling green hills, tea slopes, and orange gardens overlooking Mount Kanchenjunga and the Teesta corridor.
                    </p>
                  </div>
                  <div className="pt-4">
                    <p className="font-medium text-[#18352B]">From Bagdogra Airport (IXB) & NJP</p>
                    <p className="text-[#58636B] mt-1">
                      Scenic ~2.5 to 3 hour drive via Sevoke and Teesta Bazaar. Dedicated car parking and on-site driver accommodation are available at the resort.
                    </p>
                  </div>
                  <div className="pt-4">
                    <p className="font-medium text-[#18352B]">Best Season & Hospitality</p>
                    <p className="text-[#58636B] mt-1">
                      Crisp clear views from October to March. Hosts {settings.hosts || 'Joy Banerjee & Prasanta Das'} welcome family vacations, friends, and corporate retreats.
                    </p>
                  </div>
                </div>
              </div>

              <Button asChild className="w-full">
                <a
                  href={settings.googleMapsLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
