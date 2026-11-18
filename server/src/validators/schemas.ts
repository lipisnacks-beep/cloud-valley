import { z } from 'zod';
import {
  BOOKING_STATUSES,
  DINING_CATEGORIES,
  EXPERIENCE_CATEGORIES,
  FAQ_CATEGORIES,
  GALLERY_CATEGORIES,
  MESSAGE_STATUSES,
} from '../../../shared/constants/index.ts';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const adminProfileUpdateSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).max(100).optional(),
});

export const customerRegisterSchema = z.object({
  name: z.string().trim().min(2, 'Full name must be at least 2 characters').max(80),
  email: z.string().trim().email('Please enter a valid email address'),
  phone: z.string().trim().min(7, 'Please enter a valid phone number').max(30),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
});

export const customerLoginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const customerProfileUpdateSchema = z.object({
  name: z.string().trim().min(2, 'Full name must be at least 2 characters').max(80),
  phone: z.string().trim().min(7, 'Please enter a valid phone number').max(30),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').max(100).optional(),
});

export const customerCancellationRequestSchema = z.object({
  reason: z.string().trim().min(3, 'Please provide a brief cancellation reason').max(500),
});

export const bookingCreateSchema = z
  .object({
    guestName: z.string().trim().min(2, 'Full name is required').max(120),
    phone: z.string().trim().min(7, 'Valid phone number is required').max(30),
    email: z.string().trim().email('Valid email address is required'),
    checkIn: z.string().min(8, 'Check-in date is required'),
    checkOut: z.string().min(8, 'Check-out date is required'),
    adults: z.coerce.number().int().min(1, 'At least 1 adult is required').max(20),
    children: z.coerce.number().int().min(0).max(20).default(0),
    roomId: z.string().min(1, 'Please select a room category'),
    roomsRequested: z.coerce.number().int().min(1).max(10).default(1),
    mealPlan: z.enum(['EP', 'CP', 'MAP', 'AP']).optional().default('EP'),
    extraPersons: z.coerce.number().int().min(0).max(20).optional().default(0),
    specialRequests: z.string().max(1000).optional().default(''),
    arrivalTime: z.string().max(60).optional().default(''),
  })
  .refine(
    (data) => {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const inDate = new Date(data.checkIn);
      inDate.setUTCHours(0, 0, 0, 0);
      return !Number.isNaN(inDate.getTime()) && inDate >= today;
    },
    { message: 'Check-in date cannot be in the past', path: ['checkIn'] }
  )
  .refine(
    (data) => {
      const inDate = new Date(data.checkIn);
      const outDate = new Date(data.checkOut);
      return (
        !Number.isNaN(inDate.getTime()) &&
        !Number.isNaN(outDate.getTime()) &&
        outDate > inDate
      );
    },
    { message: 'Check-out date must be after check-in date', path: ['checkOut'] }
  );

export const bookingStatusSchema = z.object({
  status: z.enum(BOOKING_STATUSES),
  internalNotes: z.string().max(2000).optional(),
});

export const bookingUpdateSchema = z.object({
  guestName: z.string().min(2).max(120).optional(),
  phone: z.string().min(7).max(30).optional(),
  email: z.string().email().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  adults: z.coerce.number().int().min(1).max(20).optional(),
  children: z.coerce.number().int().min(0).max(20).optional(),
  roomsRequested: z.coerce.number().int().min(1).max(10).optional(),
  specialRequests: z.string().max(1000).optional(),
  arrivalTime: z.string().max(60).optional(),
  internalNotes: z.string().max(2000).optional(),
});

export const cancellationRequestSchema = z.object({
  email: z.string().email('Please verify your booking email address'),
  reason: z.string().trim().min(3, 'Please provide a brief cancellation reason').max(500),
});

export const roomSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain lowercase letters, numbers, and hyphens only'),
  shortDescription: z.string().trim().min(10).max(260),
  description: z.string().trim().min(20).max(3000),
  pricePerNight: z.coerce.number().min(0).max(500000),
  mealPlans: z
    .array(
      z.object({
        code: z.enum(['EP', 'CP', 'MAP', 'AP']),
        label: z.string().min(1),
        description: z.string().default(''),
        roomRate: z.coerce.number().min(0),
        extraPersonRate: z.coerce.number().min(0),
      })
    )
    .optional(),
  maxGuests: z.coerce.number().int().min(1).max(20),
  totalUnits: z.coerce.number().int().min(1).max(50),
  bedType: z.string().max(80).optional().default(''),
  roomSize: z.string().max(80).optional().default(''),
  viewType: z.string().max(120).optional().default(''),
  amenities: z.array(z.string().trim().min(1)).default([]),
  images: z
    .array(
      z.object({
        url: z.string().min(1),
        publicId: z.string().optional(),
        alt: z.string().default(''),
      })
    )
    .default([]),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export const blockedDateSchema = z
  .object({
    roomId: z.string().min(1),
    startDate: z.string().min(8),
    endDate: z.string().min(8),
    unitsBlocked: z.coerce.number().int().min(1).max(50).default(1),
    reason: z.string().max(300).optional().default('Maintenance / Owner Block'),
  })
  .refine((d) => new Date(d.endDate) > new Date(d.startDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

export const gallerySchema = z.object({
  title: z.string().trim().min(2).max(140),
  imageUrl: z.string().trim().min(1),
  cloudinaryPublicId: z.string().optional(),
  category: z.enum(GALLERY_CATEGORIES),
  alt: z.string().trim().min(2).max(200),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export const experienceSchema = z.object({
  title: z.string().trim().min(2).max(140),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(140)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().trim().min(10).max(2000),
  duration: z.string().max(80).optional().default(''),
  bestTime: z.string().max(80).optional().default(''),
  distance: z.string().max(80).optional().default(''),
  images: z
    .array(
      z.object({
        url: z.string().min(1),
        publicId: z.string().optional(),
        alt: z.string().default(''),
      })
    )
    .default([]),
  category: z.enum(EXPERIENCE_CATEGORIES),
  location: z.string().trim().min(2).max(160),
  isPublished: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export const diningSchema = z.object({
  title: z.string().trim().min(2).max(140),
  category: z.enum(DINING_CATEGORIES),
  description: z.string().trim().min(10).max(2000),
  timing: z.string().max(100).optional().default(''),
  dietaryNote: z.string().max(160).optional().default(''),
  imageUrl: z.string().trim().min(1),
  alt: z.string().trim().min(2).max(200),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export const reviewSchema = z.object({
  guestName: z.string().trim().min(2).max(100),
  guestLocation: z.string().max(100).optional().default(''),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(1200),
  sourceLabel: z.string().max(80).optional().default(''),
  stayDate: z.string().max(60).optional().default(''),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(true),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(120),
  email: z.string().trim().email('Please enter a valid email'),
  phone: z.string().trim().min(7, 'Please enter a valid phone number').max(30),
  subject: z.string().trim().min(3, 'Please enter a subject').max(160),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(2500),
});

export const messageStatusSchema = z.object({
  status: z.enum(MESSAGE_STATUSES),
});

export const faqSchema = z.object({
  question: z.string().trim().min(5).max(300),
  answer: z.string().trim().min(5).max(2000),
  category: z.enum(FAQ_CATEGORIES),
  isPublished: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export const settingsSchema = z.object({
  resortName: z.string().trim().min(2).max(120),
  tagline: z.string().trim().min(2).max(180),
  logoText: z.string().trim().min(2).max(80),
  logoUrl: z.string().optional().default(''),
  phone: z.string().trim().min(5).max(40),
  secondaryPhones: z.array(z.string().trim()).optional().default([]),
  hosts: z.string().trim().max(160).optional().default(''),
  whatsapp: z.string().trim().min(5).max(40),
  email: z.string().trim().email(),
  address: z.string().trim().min(5).max(300),
  googleMapsEmbedUrl: z.string().trim().min(5),
  googleMapsLink: z.string().trim().min(5),
  instagramUrl: z.string().optional().default(''),
  facebookUrl: z.string().optional().default(''),
  checkInTime: z.string().trim().min(2).max(40),
  checkOutTime: z.string().trim().min(2).max(40),
  currency: z.string().trim().min(2).max(10).default('INR'),
  timezone: z.string().trim().min(2).max(60).default('Asia/Kolkata'),
  defaultBookingPolicy: z.string().trim().min(5).max(1000),
  seoTitle: z.string().trim().min(5).max(160),
  seoDescription: z.string().trim().min(10).max(320),
  emailNotificationsEnabled: z.boolean().default(true),
});

export const cmsUpdateSchema = z.object({
  slug: z.string().min(2).max(80),
  title: z.string().min(2).max(200),
  subtitle: z.string().max(300).optional().default(''),
  body: z.string().default(''),
  sections: z.record(z.string(), z.string()).optional(),
  seoTitle: z.string().max(160).optional(),
  seoDescription: z.string().max(320).optional(),
});
