import React, { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, MessageCircle, X, MapPin, Phone, Mail, User } from 'lucide-react';
import { usePublicData } from '../../context/SettingsContext';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { buildWhatsAppUrl, cn } from '../../lib/utils';

const primaryNavLinks = [
  { to: '/about', label: 'About' },
  { to: '/rooms', label: 'Rooms' },
  { to: '/experiences', label: 'Experiences' },
  { to: '/dining', label: 'Dining' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/contact', label: 'Contact' },
];

export function PublicLayout() {
  const { settings } = usePublicData();
  const { customer, logoutCustomer } = useCustomerAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const whatsappHref = buildWhatsAppUrl(
    settings.whatsapp,
    `Hello ${settings.resortName}, I would like to know more about your resort and accommodation.`
  );

  const transparentTop = isHome && !scrolled;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F5EF] text-[#18352B]">
      {/* Sticky Top Bar (3-zone contract) */}
      <header
        className={cn(
          'fixed top-0 inset-x-0 z-40 h-16 transition-colors duration-200',
          transparentTop
            ? 'bg-gradient-to-b from-[#18352B]/75 to-transparent text-[#F8F5EF]'
            : 'bg-[#F8F5EF]/95 backdrop-blur-md text-[#18352B] border-b border-[#18352B]/10'
        )}
      >
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
          {/* Zone 1: Wordmark */}
          <Link
            to="/"
            className="font-display text-xl sm:text-2xl font-semibold tracking-tight whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6A66B] rounded"
          >
            {settings.logoText || settings.resortName}
          </Link>

          {/* Zone 2: Clean single-line nav links */}
          <nav
            aria-label="Primary navigation"
            className="hidden lg:flex items-center gap-7 text-sm font-medium"
          >
            {primaryNavLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'whitespace-nowrap shrink-0 py-1 border-b transition-colors duration-150',
                    isActive
                      ? transparentTop
                        ? 'border-[#C6A66B] text-white'
                        : 'border-[#234638] text-[#18352B]'
                      : transparentTop
                        ? 'border-transparent text-[#F8F5EF]/90 hover:text-white hover:border-[#C6A66B]/60'
                        : 'border-transparent text-[#58636B] hover:text-[#18352B] hover:border-[#234638]/40'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Zone 3: Guest Auth + Primary CTA + Mobile Trigger */}
          <div className="flex items-center gap-3 shrink-0">
            {customer ? (
              <Link
                to="/account"
                className={cn(
                  'hidden sm:inline-flex items-center gap-1.5 h-10 px-3 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150',
                  transparentTop
                    ? 'text-[#F8F5EF] hover:bg-white/10'
                    : 'text-[#18352B] hover:bg-[#E9E0D1]'
                )}
              >
                <User className="w-4 h-4 shrink-0" />
                <span>My Account</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className={cn(
                  'hidden sm:inline-flex items-center h-10 px-3 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150',
                  transparentTop
                    ? 'text-[#F8F5EF] hover:bg-white/10'
                    : 'text-[#18352B] hover:bg-[#E9E0D1]'
                )}
              >
                Sign In
              </Link>
            )}

            <Link
              to="/booking"
              className={cn(
                'inline-flex items-center justify-center h-10 px-5 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150',
                transparentTop
                  ? 'bg-[#C6A66B] text-[#18352B] hover:bg-[#d5b77d]'
                  : 'bg-[#234638] text-[#F8F5EF] hover:bg-[#18352B]'
              )}
            >
              Book Now
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              className={cn(
                'lg:hidden inline-flex items-center justify-center h-10 w-10 rounded-md transition-colors',
                transparentTop
                  ? 'text-white hover:bg-white/15'
                  : 'text-[#18352B] hover:bg-[#E9E0D1]'
              )}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-[#18352B] text-[#F8F5EF] pt-20 px-6 pb-8 flex flex-col justify-between lg:hidden overflow-y-auto">
          <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
            {[
              { to: '/', label: 'Home' },
              ...primaryNavLinks,
              { to: '/location', label: 'Location & Directions' },
              { to: '/faq', label: 'FAQ' },
              ...(customer
                ? [{ to: '/account', label: 'My Account' }]
                : [
                    { to: '/login', label: 'Guest Sign In' },
                    { to: '/register', label: 'Create Account' },
                  ]),
            ].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'py-3.5 text-lg font-display border-b border-white/10 transition-colors',
                    isActive ? 'text-[#C6A66B]' : 'text-[#F8F5EF] hover:text-[#C6A66B]'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="pt-6 space-y-3">
            <Link
              to="/booking"
              className="block w-full text-center py-3 rounded-md bg-[#C6A66B] text-[#18352B] font-semibold text-sm"
            >
              Request Your Stay
            </Link>
            {customer && (
              <button
                type="button"
                onClick={() => {
                  logoutCustomer();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-center py-2.5 rounded-md border border-white/20 text-[#F8F5EF] text-sm"
              >
                Sign Out ({customer.name})
              </button>
            )}
            <div className="text-xs text-[#F8F5EF]/75 space-y-1 pt-1">
              <p>{settings.address}</p>
              <p>{settings.phone} · {settings.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={cn('flex-1', !isHome && 'pt-16')}>
        <Outlet />
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="bg-[#18352B] text-[#F8F5EF] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">
            <div className="space-y-4">
              <Link to="/" className="font-display text-2xl font-semibold tracking-tight block">
                {settings.resortName}
              </Link>
              <p className="text-sm text-[#F8F5EF]/75 leading-relaxed max-w-xs">
                {settings.tagline}. Samalbong’s only 3-star property offering panoramic views of Mount Kanchenjunga from every room.
              </p>
              {settings.hosts && (
                <p className="text-xs text-[#C6A66B]">
                  Hosted by {settings.hosts}
                </p>
              )}
              <div className="flex items-center gap-4 text-xs text-[#C6A66B]">
                {settings.instagramUrl && (
                  <a
                    href={settings.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    Instagram
                  </a>
                )}
                {settings.facebookUrl && (
                  <a
                    href={settings.facebookUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    Facebook
                  </a>
                )}
                <a
                  href={settings.googleMapsLink}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  Google Maps
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold tracking-wider text-[#C6A66B] mb-4">
                The Resort
              </h3>
              <ul className="space-y-2.5 text-sm text-[#F8F5EF]/80">
                <li><Link to="/about" className="hover:text-white transition-colors">About & Facilities</Link></li>
                <li><Link to="/rooms" className="hover:text-white transition-colors">Rooms & Tariff (EP–AP)</Link></li>
                <li><Link to="/dining" className="hover:text-white transition-colors">Dining & Tea Bar</Link></li>
                <li><Link to="/experiences" className="hover:text-white transition-colors">9 Sightseeing Spots</Link></li>
                <li><Link to="/gallery" className="hover:text-white transition-colors">Gallery & Brochure</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold tracking-wider text-[#C6A66B] mb-4">
                Guest Information
              </h3>
              <ul className="space-y-2.5 text-sm text-[#F8F5EF]/80">
                <li><Link to="/booking" className="hover:text-white transition-colors">Booking Request</Link></li>
                <li><Link to="/account" className="hover:text-white transition-colors">Guest Account</Link></li>
                <li><Link to="/location" className="hover:text-white transition-colors">Location & Directions</Link></li>
                <li><Link to="/faq" className="hover:text-white transition-colors">Frequently Asked Questions</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact & Corporate Tie-Ups</Link></li>
                <li><Link to="/admin/login" className="hover:text-white transition-colors">Staff Portal</Link></li>
              </ul>
            </div>

            <div className="space-y-3 text-sm text-[#F8F5EF]/80">
              <h3 className="text-xs font-semibold tracking-wider text-[#C6A66B] mb-4">
                Samalbong Desk
              </h3>
              <p className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-[#C6A66B]" />
                <span>{settings.address}</span>
              </p>
              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 mt-1 shrink-0 text-[#C6A66B]" />
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 tabular-nums">
                  {Array.from(new Set([settings.phone, ...(settings.secondaryPhones || [])].filter(Boolean)))
                    .map((num) => (
                      <a
                        key={num}
                        href={`tel:${num.replace(/\s+/g, '')}`}
                        className="hover:text-white whitespace-nowrap"
                      >
                        {num}
                      </a>
                    ))}
                </div>
              </div>
              <p className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 shrink-0 text-[#C6A66B]" />
                <a href={`mailto:${settings.email}`} className="hover:text-white break-all">{settings.email}</a>
              </p>
              <p className="pt-1 text-xs text-[#F8F5EF]/60">
                Check-in {settings.checkInTime} · Check-out {settings.checkOutTime} · Best Time: Oct–Mar
              </p>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#F8F5EF]/65">
            <p>© {new Date().getFullYear()} {settings.resortName}, Samalbong. All rights reserved.</p>
            <div className="flex items-center gap-5">
              <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
              <Link to="/cancellation-policy" className="hover:text-white transition-colors">Cancellation Policy</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Quick Action */}
      <a
        href={whatsappHref}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with CLOUD VALLEY on WhatsApp"
        className="fixed bottom-5 right-5 z-30 h-12 w-12 rounded-full bg-[#234638] text-[#F8F5EF] border border-[#C6A66B]/60 shadow-lg flex items-center justify-center hover:bg-[#18352B] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6A66B]"
      >
        <MessageCircle className="w-5 h-5 text-[#C6A66B]" />
      </a>
    </div>
  );
}
