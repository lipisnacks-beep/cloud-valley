export type BookingStatus = 'Pending' | 'Confirmed' | 'Rejected' | 'Cancelled' | 'Completed';

export type MessageStatus = 'Unread' | 'Read' | 'Replied' | 'Archived';

export interface MediaImage {
  url: string;
  publicId?: string;
  alt: string;
}

export type MealPlanCode = 'EP' | 'CP' | 'MAP' | 'AP';

export interface MealPlanTariff {
  code: MealPlanCode;
  label: string;
  description: string;
  roomRate: number;
  extraPersonRate: number;
}

export interface Room {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  pricePerNight: number;
  mealPlans?: MealPlanTariff[];
  maxGuests: number;
  totalUnits: number;
  bedType?: string;
  roomSize?: string;
  viewType?: string;
  amenities: string[];
  images: MediaImage[];
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  _id: string;
  bookingReference: string;
  customerId?: string;
  guestName: string;
  phone: string;
  email: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  roomId: string;
  roomName: string;
  roomsRequested: number;
  mealPlan?: MealPlanCode;
  extraPersons?: number;
  estimatedPrice: number;
  specialRequests?: string;
  arrivalTime?: string;
  status: BookingStatus;
  cancellationRequested?: boolean;
  cancellationReason?: string;
  internalNotes?: string;
  source: 'website' | 'admin' | 'whatsapp';
  createdAt: string;
  updatedAt: string;
}

export interface BlockedDate {
  _id: string;
  roomId: string;
  roomName?: string;
  startDate: string;
  endDate: string;
  unitsBlocked: number;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryItem {
  _id: string;
  title: string;
  imageUrl: string;
  cloudinaryPublicId?: string;
  category: 'Resort' | 'Rooms' | 'Views' | 'Dining' | 'Experiences';
  alt: string;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Experience {
  _id: string;
  title: string;
  slug: string;
  description: string;
  duration?: string;
  bestTime?: string;
  distance?: string;
  images: MediaImage[];
  category: 'Nature Walk' | 'Sightseeing' | 'Culture' | 'Wellness';
  location: string;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface DiningItem {
  _id: string;
  title: string;
  category: 'Breakfast' | 'Lunch' | 'Evening Tea' | 'Dinner' | 'Local Specialty';
  description: string;
  timing?: string;
  dietaryNote?: string;
  imageUrl: string;
  alt: string;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  _id: string;
  guestName: string;
  guestLocation?: string;
  rating: number;
  comment: string;
  sourceLabel?: string;
  stayDate?: string;
  isFeatured: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: MessageStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category: 'Booking' | 'Stay & Rooms' | 'Travel & Location' | 'Dining & Facilities';
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PageContent {
  _id: string;
  slug: string;
  title: string;
  subtitle?: string;
  body: string;
  sections?: Record<string, string>;
  seoTitle?: string;
  seoDescription?: string;
  updatedAt: string;
}

export interface HomeCMSContent {
  heroHeadline: string;
  heroSubtitle: string;
  heroImageUrl: string;
  welcomeTitle: string;
  welcomeBody: string;
  welcomeImageUrl: string;
  experienceTitle: string;
  experienceSubtitle: string;
  diningTitle: string;
  diningSubtitle: string;
  diningImageUrl: string;
  ctaTitle: string;
  ctaSubtitle: string;
  aboutStoryTitle: string;
  aboutStoryBody: string;
  aboutPhilosophy: string;
}

export interface SiteSettings {
  _id?: string;
  resortName: string;
  tagline: string;
  logoText: string;
  logoUrl?: string;
  phone: string;
  secondaryPhones?: string[];
  hosts?: string;
  whatsapp: string;
  email: string;
  address: string;
  googleMapsEmbedUrl: string;
  googleMapsLink: string;
  instagramUrl?: string;
  facebookUrl?: string;
  checkInTime: string;
  checkOutTime: string;
  currency: string;
  timezone: string;
  defaultBookingPolicy: string;
  seoTitle: string;
  seoDescription: string;
  emailNotificationsEnabled: boolean;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'admin';
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CustomerUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer';
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminNotification {
  _id: string;
  title: string;
  message: string;
  type: 'booking' | 'cancellation' | 'message' | 'system';
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AvailabilityResult {
  roomId: string;
  roomName: string;
  slug: string;
  totalUnits: number;
  bookedUnits: number;
  blockedUnits: number;
  availableUnits: number;
  isAvailable: boolean;
  pricePerNight: number;
  nights: number;
  estimatedTotal: number;
}

export interface DashboardAnalytics {
  kpis: {
    totalBookings: number;
    pendingBookings: number;
    confirmedBookings: number;
    cancelledBookings: number;
    todayArrivals: number;
    todayDepartures: number;
    totalRoomCategories: number;
    monthBookings: number;
    unreadMessages: number;
  };
  monthlyTrend: { month: string; requests: number; confirmed: number }[];
  statusDistribution: { status: BookingStatus; count: number }[];
  roomDemand: { roomName: string; bookings: number }[];
  recentBookings: Booking[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
  errors?: { field?: string; message: string }[];
}
