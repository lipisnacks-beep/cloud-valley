import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Building2, Mail, MapPin, MessageCircle, Phone, CheckCircle2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '../../services/api';
import { usePublicData } from '../../context/SettingsContext';
import { SEOHead } from '../../components/shared/SEOHead';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { buildWhatsAppUrl } from '../../lib/utils';

export function ContactPage() {
  const [searchParams] = useSearchParams();
  const { settings } = usePublicData();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState(searchParams.get('subject') || '');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const contactMutation = useMutation({
    mutationFn: api.submitContact,
    onSuccess: (res) => {
      toast.success(res.message);
      setSubmitted(true);
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Could not send message.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    contactMutation.mutate({ name, email, phone, subject, message });
  };

  const whatsappUrl = buildWhatsAppUrl(
    settings.whatsapp,
    `Hello ${settings.resortName}, I have an inquiry regarding a stay / group booking at Samalbong.`
  );

  const allPhones = Array.from(
    new Set([settings.phone, ...(settings.secondaryPhones || [])].filter(Boolean))
  );

  return (
    <>
      <SEOHead
        title={`Contact Us — ${settings.resortName} Samalbong`}
        description="Get in touch with Cloud Valley Resort hosts Joy Banerjee & Prasanta Das in Samalbong Khasmahal (Sinji), Kalimpong for stay bookings and corporate tie-ups."
        canonicalPath="/contact"
      />

      <section className="py-16 sm:py-22 bg-[#F8F5EF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-medium tracking-widest text-[#234638]">
              Contact & Corporate Tie-Ups
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-medium text-[#18352B]">
              Speak directly with our hosts in Samalbong
            </h1>
            <p className="text-base text-[#58636B]">
              Questions about room availability, Kalimpong sightseeing cabs, 50-seated conference hall bookings, or corporate tie-ups? Reach out directly to {settings.hosts || 'Joy Banerjee & Prasanta Das'}.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 bg-white rounded-lg border border-[#18352B]/12 p-6 sm:p-8">
              {submitted ? (
                <div className="py-10 text-center space-y-4">
                  <CheckCircle2 className="w-10 h-10 text-[#234638] mx-auto" />
                  <h2 className="font-display text-2xl text-[#18352B]">Message Received</h2>
                  <p className="text-sm text-[#58636B] max-w-md mx-auto">
                    Thank you for reaching out. Our hospitality desk will respond shortly.
                  </p>
                  <Button variant="outline" onClick={() => setSubmitted(false)}>
                    Send Another Inquiry
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="c-name">Your Name *</Label>
                      <Input
                        id="c-name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="c-phone">Phone / WhatsApp Number *</Label>
                      <Input
                        id="c-phone"
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="c-email">Email Address *</Label>
                    <Input
                      id="c-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="c-subject">Subject *</Label>
                    <Input
                      id="c-subject"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g., Corporate Tie-Up / Group Stay / Sightseeing Inquiry"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="c-message">Message *</Label>
                    <Textarea
                      id="c-message"
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Share travel dates, group size, conference requirements, or questions..."
                    />
                  </div>
                  <Button type="submit" size="lg" disabled={contactMutation.isPending}>
                    {contactMutation.isPending ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              )}
            </div>

            <aside className="lg:col-span-5 space-y-5">
              <div className="bg-white rounded-lg border border-[#18352B]/12 p-6 sm:p-7 space-y-5">
                <h2 className="font-display text-2xl font-medium text-[#18352B]">
                  Resort Contact Details
                </h2>
                <div className="space-y-4 text-sm text-[#18352B]">
                  <div className="flex items-start gap-3">
                    <Users className="w-4 h-4 mt-1 text-[#234638] shrink-0" />
                    <div>
                      <p className="font-medium">Hosts</p>
                      <p className="text-[#58636B] mt-0.5">{settings.hosts || 'Joy Banerjee & Prasanta Das'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 mt-1 text-[#234638] shrink-0" />
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-[#58636B] mt-0.5">{settings.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 mt-1 text-[#234638] shrink-0" />
                    <div>
                      <p className="font-medium">Mobile & WhatsApp</p>
                      <div className="flex flex-col gap-1 mt-0.5 tabular-nums">
                        {allPhones.map((num) => (
                          <a key={num} href={`tel:${num.replace(/\s+/g, '')}`} className="text-[#58636B] hover:text-[#18352B]">
                            {num}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 mt-1 text-[#234638] shrink-0" />
                    <div>
                      <p className="font-medium">Email</p>
                      <a href={`mailto:${settings.email}`} className="text-[#58636B] hover:text-[#18352B] break-all">
                        {settings.email}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 pt-2 border-t border-[#18352B]/10">
                    <Building2 className="w-4 h-4 mt-1 text-[#234638] shrink-0" />
                    <div>
                      <p className="font-medium">Corporate Tie-Ups & Groups</p>
                      <p className="text-xs text-[#58636B] mt-0.5 leading-relaxed">
                        50-seated conference room, 9 Double Bedded & 2 Four Bedded rooms, in-house multi-cuisine catering, parking, and driver accommodation available.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#234638] text-[#F8F5EF] rounded-lg p-6 space-y-3">
                <h3 className="font-display text-xl">Quick WhatsApp Assistance</h3>
                <p className="text-xs text-[#F8F5EF]/80 leading-relaxed">
                  Message Joy Banerjee & Prasanta Das directly for immediate room availability, group packages, or Kalimpong transfers.
                </p>
                <Button asChild variant="accent" className="w-full">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat on WhatsApp ({settings.phone})</span>
                  </a>
                </Button>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
