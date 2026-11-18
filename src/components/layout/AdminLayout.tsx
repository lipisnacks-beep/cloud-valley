import React, { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  BedDouble,
  CalendarDays,
  ChevronDown,
  Compass,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageSquareQuote,
  Search,
  Settings,
  User,
  Utensils,
  X,
  BookCheck,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/bookings', label: 'Bookings', icon: BookCheck },
  { to: '/admin/rooms', label: 'Rooms', icon: BedDouble },
  { to: '/admin/availability', label: 'Availability', icon: CalendarDays },
  { to: '/admin/gallery', label: 'Gallery', icon: ImageIcon },
  { to: '/admin/experiences', label: 'Experiences', icon: Compass },
  { to: '/admin/dining', label: 'Dining', icon: Utensils },
  { to: '/admin/reviews', label: 'Reviews', icon: MessageSquareQuote },
  { to: '/admin/messages', label: 'Messages', icon: Mail },
  { to: '/admin/content', label: 'Website Content', icon: FileText },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
  { to: '/admin/profile', label: 'Profile', icon: User },
];

const routeTitles: Record<string, string> = {
  '/admin': 'Dashboard Overview',
  '/admin/bookings': 'Booking Management',
  '/admin/rooms': 'Room Categories',
  '/admin/rooms/create': 'Add New Room',
  '/admin/availability': 'Availability & Calendar',
  '/admin/gallery': 'Photo Gallery',
  '/admin/experiences': 'Experiences',
  '/admin/dining': 'Dining Content',
  '/admin/reviews': 'Guest Reviews',
  '/admin/messages': 'Contact Messages',
  '/admin/content': 'Website CMS & FAQs',
  '/admin/settings': 'Resort Settings',
  '/admin/profile': 'Admin Profile',
};

export function AdminLayout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');

  const notifQuery = useQuery({
    queryKey: ['admin', 'notifications'],
    queryFn: api.getNotifications,
    refetchInterval: 30_000,
  });

  const markReadMutation = useMutation({
    mutationFn: api.markNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] }),
  });

  const notifications = notifQuery.data || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const currentTitle =
    routeTitles[location.pathname] ||
    (location.pathname.includes('/bookings/')
      ? 'Booking Details'
      : location.pathname.includes('/edit')
        ? 'Edit Room'
        : 'Admin Panel');

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      navigate(`/admin/bookings?search=${encodeURIComponent(quickSearch.trim())}`);
      setQuickSearch('');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#F5F6F4] text-slate-900 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-[#18352B] text-[#F8F5EF] border-r border-white/10 no-print">
        <div className="h-16 px-5 flex items-center justify-between border-b border-white/10">
          <Link to="/admin" className="font-display text-lg font-semibold tracking-tight whitespace-nowrap">
            CLOUD VALLEY
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[#234638] text-[#C6A66B]'
                      : 'text-[#F8F5EF]/80 hover:bg-white/10 hover:text-white'
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-md text-xs text-[#F8F5EF]/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <span>View Public Website</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50"
            aria-hidden="true"
          />
          <aside className="relative w-64 max-w-[80vw] bg-[#18352B] text-[#F8F5EF] flex flex-col h-full z-10">
            <div className="h-16 px-5 flex items-center justify-between border-b border-white/10">
              <span className="font-display text-lg font-semibold">CLOUD VALLEY</span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
                className="p-1.5 rounded hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium',
                        isActive ? 'bg-[#234638] text-[#C6A66B]' : 'text-[#F8F5EF]/80'
                      )
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="lg:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-sm text-slate-500 truncate">
              <span className="hidden sm:inline">Admin / </span>
              <span className="font-semibold text-slate-900">{currentTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <form onSubmit={handleQuickSearch} className="hidden md:flex items-center relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="search"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder="Find booking ref or guest..."
                className="h-9 w-56 rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#234638]"
              />
            </form>

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((v) => !v);
                  setProfileOpen(false);
                }}
                aria-label="Notifications"
                className="relative h-9 w-9 rounded-md border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-[#234638] text-white text-[10px] font-mono flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg border border-slate-200 shadow-lg z-40 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => markReadMutation.mutate()}
                        className="text-xs text-[#234638] hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-xs text-slate-500 text-center">No recent notifications.</p>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <div
                          key={n._id}
                          className={cn('p-3.5 text-xs space-y-1', !n.isRead && 'bg-[#F8F5EF]')}
                        >
                          <p className="font-semibold text-slate-900">{n.title}</p>
                          <p className="text-slate-600">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen((v) => !v);
                  setNotifOpen(false);
                }}
                className="h-9 px-3 rounded-md border border-slate-200 flex items-center gap-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <span className="max-w-28 truncate">{admin?.name || 'Admin'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border border-slate-200 shadow-lg py-1 z-40 text-xs">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="font-semibold text-slate-900 truncate">{admin?.name}</p>
                    <p className="text-slate-500 truncate">{admin?.email}</p>
                  </div>
                  <Link
                    to="/admin/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-slate-700"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Profile & Password</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-700 text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
