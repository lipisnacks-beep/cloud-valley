import crypto from 'node:crypto';
import { Router, type Request, type Response, type NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import {
  addNotification,
  createBlockedDate,
  createBooking,
  createContactMessage,
  createCustomer,
  createDiningItem,
  createExperience,
  createFAQ,
  createGalleryItem,
  createReview,
  createRoom,
  deleteBlockedDate,
  deleteBooking,
  deleteContactMessage,
  deleteDiningItem,
  deleteExperience,
  deleteFAQ,
  deleteGalleryItem,
  deleteReview,
  deleteRoom,
  findAdminByEmail,
  findAdminById,
  findCustomerByEmail,
  findCustomerById,
  getBookingById,
  getBookingByReference,
  getGalleryById,
  getPageBySlug,
  getRoomById,
  getRoomBySlug,
  getSiteSettings,
  listBlockedDates,
  listBookings,
  listContactMessages,
  listCustomerBookings,
  listDining,
  listExperiences,
  listFAQs,
  listGallery,
  listNotifications,
  listPages,
  listReviews,
  listRooms,
  markNotificationsRead,
  updateAdmin,
  updateBooking,
  updateContactMessage,
  updateCustomer,
  updateDiningItem,
  updateExperience,
  updateFAQ,
  updateGalleryItem,
  updateReview,
  updateRoom,
  updateSiteSettings,
  upsertPage,
} from '../services/dataStore.ts';
import {
  calculateNights,
  checkAvailabilityForDates,
  normalizeUtcDate,
} from '../services/availabilityService.ts';
import { notifyBookingStatusChange, notifyNewBooking } from '../services/emailService.ts';
import { deleteMediaAsset, uploadMediaAsset } from '../config/cloudinary.ts';
import {
  adminProfileUpdateSchema,
  blockedDateSchema,
  bookingCreateSchema,
  bookingStatusSchema,
  bookingUpdateSchema,
  cancellationRequestSchema,
  cmsUpdateSchema,
  contactSchema,
  customerCancellationRequestSchema,
  customerLoginSchema,
  customerProfileUpdateSchema,
  customerRegisterSchema,
  diningSchema,
  experienceSchema,
  faqSchema,
  gallerySchema,
  loginSchema,
  messageStatusSchema,
  reviewSchema,
  roomSchema,
  settingsSchema,
} from '../validators/schemas.ts';
import {
  type AuthenticatedRequest,
  type CustomerAuthenticatedRequest,
  clearAuthCookie,
  clearCustomerAuthCookie,
  loginRateLimiter,
  publicSubmissionRateLimiter,
  requireAdminAuth,
  requireCustomerAuth,
  setAuthCookie,
  setCustomerAuthCookie,
  signAdminToken,
  signCustomerToken,
} from '../middleware/auth.ts';
import { env } from '../config/env.ts';
import type { BookingStatus } from '../../../shared/types/index.ts';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are permitted.'));
    }
  },
});

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };

function generateBookingReference(): string {
  const now = new Date();
  const yy = String(now.getUTCFullYear()).slice(-2);
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const rand = crypto.randomInt(1000, 9999);
  return `CV-${yy}${mm}-${rand}`;
}

export function createApiRouter(): Router {
  const router = Router();

  // ================= AUTH =================
  router.post(
    '/auth/login',
    loginRateLimiter,
    asyncHandler(async (req, res) => {
      const parsed = loginSchema.parse(req.body);
      const admin = await findAdminByEmail(parsed.email);
      if (!admin || admin.isActive === false) {
        res.status(401).json({ success: false, message: 'Invalid email or password.' });
        return;
      }

      const valid = await bcrypt.compare(parsed.password, admin.passwordHash);
      if (!valid) {
        res.status(401).json({ success: false, message: 'Invalid email or password.' });
        return;
      }

      await updateAdmin(admin._id, { lastLoginAt: new Date().toISOString() });
      const token = signAdminToken({
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: 'admin',
      });
      setAuthCookie(req, res, token);

      res.json({
        success: true,
        message: 'Signed in successfully.',
        data: {
          token,
          admin: {
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            isActive: admin.isActive,
          },
        },
      });
    })
  );

  router.post('/auth/logout', (req, res) => {
    clearAuthCookie(req, res);
    res.json({ success: true, message: 'Signed out.' });
  });

  router.get(
    '/auth/me',
    requireAdminAuth,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const admin = await findAdminById(req.admin!.id);
      if (!admin) {
        res.status(404).json({ success: false, message: 'Admin not found.' });
        return;
      }
      res.json({
        success: true,
        message: 'Authenticated session active.',
        data: {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          isActive: admin.isActive,
          lastLoginAt: admin.lastLoginAt,
          createdAt: admin.createdAt,
        },
      });
    })
  );

  router.put(
    '/auth/profile',
    requireAdminAuth,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const parsed = adminProfileUpdateSchema.parse(req.body);
      const existing = await findAdminById(req.admin!.id);
      if (!existing) {
        res.status(404).json({ success: false, message: 'Admin not found.' });
        return;
      }

      const patch: Record<string, unknown> = {
        name: parsed.name,
        email: parsed.email.toLowerCase(),
      };

      if (parsed.newPassword) {
        if (!parsed.currentPassword) {
          res.status(400).json({
            success: false,
            message: 'Current password is required to set a new password.',
          });
          return;
        }
        const ok = await bcrypt.compare(parsed.currentPassword, existing.passwordHash);
        if (!ok) {
          res.status(400).json({ success: false, message: 'Current password is incorrect.' });
          return;
        }
        patch.passwordHash = await bcrypt.hash(parsed.newPassword, 12);
      }

      const updated = await updateAdmin(existing._id, patch);
      res.json({
        success: true,
        message: 'Admin profile updated.',
        data: updated
          ? {
              _id: updated._id,
              name: updated.name,
              email: updated.email,
              role: updated.role,
              isActive: updated.isActive,
            }
          : null,
      });
    })
  );

  // ================= CUSTOMER AUTH & ACCOUNT =================
  router.post(
    '/customer/auth/register',
    loginRateLimiter,
    asyncHandler(async (req, res) => {
      const parsed = customerRegisterSchema.parse(req.body);
      const existing = await findCustomerByEmail(parsed.email);
      if (existing) {
        res.status(409).json({
          success: false,
          message: 'An account with this email address already exists. Please sign in instead.',
        });
        return;
      }

      const passwordHash = await bcrypt.hash(parsed.password, 12);
      const customer = await createCustomer({
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone,
        passwordHash,
      });

      const token = signCustomerToken({
        id: customer._id,
        email: customer.email,
        name: customer.name,
        role: 'customer',
      });
      setCustomerAuthCookie(req, res, token);

      res.status(201).json({
        success: true,
        message: 'Guest account created successfully.',
        data: {
          token,
          customer: {
            _id: customer._id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            role: customer.role,
            isActive: customer.isActive,
            lastLoginAt: customer.lastLoginAt,
            createdAt: customer.createdAt,
          },
        },
      });
    })
  );

  router.post(
    '/customer/auth/login',
    loginRateLimiter,
    asyncHandler(async (req, res) => {
      const parsed = customerLoginSchema.parse(req.body);
      const customer = await findCustomerByEmail(parsed.email);
      if (!customer || customer.isActive === false) {
        res.status(401).json({ success: false, message: 'Invalid email or password.' });
        return;
      }

      const valid = await bcrypt.compare(parsed.password, customer.passwordHash);
      if (!valid) {
        res.status(401).json({ success: false, message: 'Invalid email or password.' });
        return;
      }

      const now = new Date().toISOString();
      await updateCustomer(customer._id, { lastLoginAt: now });

      const token = signCustomerToken({
        id: customer._id,
        email: customer.email,
        name: customer.name,
        role: 'customer',
      });
      setCustomerAuthCookie(req, res, token);

      res.json({
        success: true,
        message: 'Signed in to your guest account.',
        data: {
          token,
          customer: {
            _id: customer._id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            role: customer.role,
            isActive: customer.isActive,
            lastLoginAt: now,
            createdAt: customer.createdAt,
          },
        },
      });
    })
  );

  router.post('/customer/auth/logout', (req, res) => {
    clearCustomerAuthCookie(req, res);
    res.json({ success: true, message: 'Signed out of guest account.' });
  });

  router.get(
    '/customer/auth/me',
    requireCustomerAuth,
    asyncHandler(async (req: CustomerAuthenticatedRequest, res) => {
      const customer = await findCustomerById(req.customer!.id);
      if (!customer) {
        res.status(404).json({ success: false, message: 'Guest account not found.' });
        return;
      }
      res.json({
        success: true,
        message: 'Guest session active.',
        data: {
          _id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          role: customer.role,
          isActive: customer.isActive,
          lastLoginAt: customer.lastLoginAt,
          createdAt: customer.createdAt,
        },
      });
    })
  );

  router.put(
    '/customer/profile',
    requireCustomerAuth,
    asyncHandler(async (req: CustomerAuthenticatedRequest, res) => {
      const parsed = customerProfileUpdateSchema.parse(req.body);
      const existing = await findCustomerById(req.customer!.id);
      if (!existing) {
        res.status(404).json({ success: false, message: 'Guest account not found.' });
        return;
      }

      const patch: Record<string, unknown> = {
        name: parsed.name,
        phone: parsed.phone,
      };

      if (parsed.newPassword) {
        if (!parsed.currentPassword) {
          res.status(400).json({
            success: false,
            message: 'Current password is required to set a new password.',
          });
          return;
        }
        const ok = await bcrypt.compare(parsed.currentPassword, existing.passwordHash);
        if (!ok) {
          res.status(400).json({ success: false, message: 'Current password is incorrect.' });
          return;
        }
        patch.passwordHash = await bcrypt.hash(parsed.newPassword, 12);
      }

      const updated = await updateCustomer(existing._id, patch);
      res.json({
        success: true,
        message: 'Profile updated successfully.',
        data: updated
          ? {
              _id: updated._id,
              name: updated.name,
              email: updated.email,
              phone: updated.phone,
              role: updated.role,
              isActive: updated.isActive,
              lastLoginAt: updated.lastLoginAt,
              createdAt: updated.createdAt,
            }
          : null,
      });
    })
  );

  router.get(
    '/customer/bookings',
    requireCustomerAuth,
    asyncHandler(async (req: CustomerAuthenticatedRequest, res) => {
      const bookings = await listCustomerBookings(req.customer!.id, req.customer!.email);
      res.json({
        success: true,
        message: 'Your reservations loaded.',
        data: bookings,
      });
    })
  );

  router.post(
    '/customer/bookings/:reference/cancellation-request',
    requireCustomerAuth,
    publicSubmissionRateLimiter,
    asyncHandler(async (req: CustomerAuthenticatedRequest, res) => {
      const parsed = customerCancellationRequestSchema.parse(req.body);
      const booking = await getBookingByReference(String(req.params.reference));
      if (!booking) {
        res.status(404).json({ success: false, message: 'Booking reference not found.' });
        return;
      }

      const ownsBooking =
        booking.customerId === req.customer!.id ||
        booking.email.toLowerCase() === req.customer!.email.toLowerCase();

      if (!ownsBooking) {
        res.status(403).json({
          success: false,
          message: 'You are not authorized to modify this reservation.',
        });
        return;
      }

      if (['Cancelled', 'Rejected', 'Completed'].includes(booking.status)) {
        res.status(400).json({
          success: false,
          message: `Cannot request cancellation for a booking that is ${booking.status}.`,
        });
        return;
      }

      const updated = await updateBooking(booking._id, {
        cancellationRequested: true,
        cancellationReason: parsed.reason,
      });

      await addNotification({
        title: 'Cancellation Request Received',
        message: `${booking.bookingReference} (${booking.guestName}) requested cancellation: ${parsed.reason}`,
        type: 'cancellation',
        referenceId: booking.bookingReference,
      });

      res.json({
        success: true,
        message: 'Cancellation request recorded. Our reservations team will update your booking shortly.',
        data: updated,
      });
    })
  );

  // ================= PUBLIC ROUTES =================
  router.get(
    '/rooms',
    asyncHandler(async (_req, res) => {
      const rooms = await listRooms(true);
      res.json({ success: true, message: 'Rooms fetched.', data: rooms });
    })
  );

  router.get(
    '/rooms/:slug',
    asyncHandler(async (req, res) => {
      const room = await getRoomBySlug(String(req.params.slug));
      if (!room || !room.isActive) {
        res.status(404).json({ success: false, message: 'Room category not found.' });
        return;
      }
      res.json({ success: true, message: 'Room details fetched.', data: room });
    })
  );

  router.get(
    '/availability',
    asyncHandler(async (req, res) => {
      const checkIn = String(req.query.checkIn || '');
      const checkOut = String(req.query.checkOut || '');
      const roomId = req.query.roomId ? String(req.query.roomId) : undefined;

      if (!checkIn || !checkOut || new Date(checkOut) <= new Date(checkIn)) {
        res.status(400).json({
          success: false,
          message: 'Please provide valid check-in and check-out dates.',
        });
        return;
      }

      const results = await checkAvailabilityForDates(checkIn, checkOut, { roomId });
      res.json({ success: true, message: 'Availability calculated.', data: results });
    })
  );

  router.post(
    '/bookings',
    requireCustomerAuth,
    publicSubmissionRateLimiter,
    asyncHandler(async (req: CustomerAuthenticatedRequest, res) => {
      const parsed = bookingCreateSchema.parse(req.body);
      const room = await getRoomById(parsed.roomId);
      if (!room || !room.isActive) {
        res.status(404).json({ success: false, message: 'Selected room category is unavailable.' });
        return;
      }

      const totalGuests = parsed.adults + parsed.children;
      const maxAllowed = room.maxGuests * parsed.roomsRequested;
      if (totalGuests > maxAllowed) {
        res.status(400).json({
          success: false,
          message: `${room.name} accommodates up to ${room.maxGuests} guests per unit (${maxAllowed} total for ${parsed.roomsRequested} unit(s)). Please select more rooms or another suite.`,
        });
        return;
      }

      const availability = await checkAvailabilityForDates(parsed.checkIn, parsed.checkOut, {
        roomId: room._id,
      });
      const roomAvail = availability[0];
      if (!roomAvail || roomAvail.availableUnits < parsed.roomsRequested) {
        res.status(409).json({
          success: false,
          message: `Only ${roomAvail?.availableUnits ?? 0} unit(s) of ${room.name} are open for your selected dates.`,
        });
        return;
      }

      // Duplicate rapid submission protection
      const existingBookings = await listBookings();
      const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
      const duplicate = existingBookings.find(
        (b) =>
          b.email.toLowerCase() === parsed.email.toLowerCase() &&
          b.roomId === room._id &&
          normalizeUtcDate(b.checkIn).getTime() === normalizeUtcDate(parsed.checkIn).getTime() &&
          normalizeUtcDate(b.checkOut).getTime() === normalizeUtcDate(parsed.checkOut).getTime() &&
          b.status === 'Pending' &&
          new Date(b.createdAt).getTime() > tenMinutesAgo
      );
      if (duplicate) {
        res.status(409).json({
          success: false,
          message: `A matching pending booking request (${duplicate.bookingReference}) was already submitted recently.`,
        });
        return;
      }

      const nights = calculateNights(parsed.checkIn, parsed.checkOut);
      const mealPlanCode = parsed.mealPlan || 'EP';
      const extraPersons = parsed.extraPersons || 0;
      const planObj = room.mealPlans?.find((m) => m.code === mealPlanCode);
      const roomNightlyRate = planObj ? planObj.roomRate : room.pricePerNight;
      const extraNightlyRate = planObj ? planObj.extraPersonRate : 0;
      const estimatedPrice =
        (roomNightlyRate * parsed.roomsRequested + extraNightlyRate * extraPersons) * nights;

      let reference = generateBookingReference();
      while (await getBookingByReference(reference)) {
        reference = generateBookingReference();
      }

      const booking = await createBooking({
        bookingReference: reference,
        customerId: req.customer!.id,
        guestName: parsed.guestName,
        phone: parsed.phone,
        email: parsed.email.toLowerCase(),
        checkIn: normalizeUtcDate(parsed.checkIn).toISOString(),
        checkOut: normalizeUtcDate(parsed.checkOut).toISOString(),
        adults: parsed.adults,
        children: parsed.children,
        roomId: room._id,
        roomName: room.name,
        roomsRequested: parsed.roomsRequested,
        mealPlan: mealPlanCode,
        extraPersons,
        estimatedPrice,
        specialRequests: parsed.specialRequests,
        arrivalTime: parsed.arrivalTime,
        status: 'Pending',
        source: 'website',
      });

      await notifyNewBooking(booking);

      res.status(201).json({
        success: true,
        message: 'Booking request submitted successfully.',
        data: booking,
      });
    })
  );

  router.get(
    '/bookings/:reference',
    asyncHandler(async (req, res) => {
      const booking = await getBookingByReference(String(req.params.reference));
      if (!booking) {
        res.status(404).json({ success: false, message: 'Booking reference not found.' });
        return;
      }

      // Securely limited summary for guest lookup
      res.json({
        success: true,
        message: 'Booking record located.',
        data: {
          bookingReference: booking.bookingReference,
          guestName: booking.guestName,
          roomName: booking.roomName,
          roomsRequested: booking.roomsRequested,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          adults: booking.adults,
          children: booking.children,
          estimatedPrice: booking.estimatedPrice,
          status: booking.status,
          cancellationRequested: Boolean(booking.cancellationRequested),
          createdAt: booking.createdAt,
        },
      });
    })
  );

  router.post(
    '/bookings/:reference/cancellation-request',
    publicSubmissionRateLimiter,
    asyncHandler(async (req, res) => {
      const parsed = cancellationRequestSchema.parse(req.body);
      const booking = await getBookingByReference(String(req.params.reference));
      if (!booking) {
        res.status(404).json({ success: false, message: 'Booking reference not found.' });
        return;
      }
      if (booking.email.toLowerCase() !== parsed.email.toLowerCase()) {
        res.status(403).json({
          success: false,
          message: 'Email address does not match this booking reference.',
        });
        return;
      }
      if (['Cancelled', 'Rejected', 'Completed'].includes(booking.status)) {
        res.status(400).json({
          success: false,
          message: `Cannot request cancellation for a booking that is ${booking.status}.`,
        });
        return;
      }

      const updated = await updateBooking(booking._id, {
        cancellationRequested: true,
        cancellationReason: parsed.reason,
      });

      await addNotification({
        title: 'Cancellation Request Received',
        message: `${booking.bookingReference} (${booking.guestName}) requested cancellation: ${parsed.reason}`,
        type: 'cancellation',
        referenceId: booking.bookingReference,
      });

      res.json({
        success: true,
        message: 'Cancellation request recorded. Our reservations team will update your booking shortly.',
        data: updated
          ? {
              bookingReference: updated.bookingReference,
              status: updated.status,
              cancellationRequested: updated.cancellationRequested,
            }
          : null,
      });
    })
  );

  router.get(
    '/gallery',
    asyncHandler(async (_req, res) => {
      const items = await listGallery(true);
      res.json({ success: true, message: 'Gallery loaded.', data: items });
    })
  );

  router.get(
    '/experiences',
    asyncHandler(async (_req, res) => {
      const items = await listExperiences(true);
      res.json({ success: true, message: 'Experiences loaded.', data: items });
    })
  );

  router.get(
    '/dining',
    asyncHandler(async (_req, res) => {
      const items = await listDining(true);
      res.json({ success: true, message: 'Dining options loaded.', data: items });
    })
  );

  router.get(
    '/reviews',
    asyncHandler(async (_req, res) => {
      const items = await listReviews(true);
      res.json({ success: true, message: 'Guest reviews loaded.', data: items });
    })
  );

  router.get(
    '/faqs',
    asyncHandler(async (_req, res) => {
      const items = await listFAQs(true);
      res.json({ success: true, message: 'FAQs loaded.', data: items });
    })
  );

  router.post(
    '/contact',
    publicSubmissionRateLimiter,
    asyncHandler(async (req, res) => {
      const parsed = contactSchema.parse(req.body);
      const saved = await createContactMessage(parsed);

      await addNotification({
        title: 'New Contact Inquiry',
        message: `${saved.name} sent a message: "${saved.subject}"`,
        type: 'message',
        referenceId: saved._id,
      });

      res.status(201).json({
        success: true,
        message: 'Your inquiry has been received. Our team at Samalbong will respond shortly.',
        data: { _id: saved._id },
      });
    })
  );

  router.get(
    '/content/home',
    asyncHandler(async (_req, res) => {
      const home = await getPageBySlug('home');
      res.json({ success: true, message: 'Homepage content loaded.', data: home });
    })
  );

  router.get(
    '/content/pages/:slug',
    asyncHandler(async (req, res) => {
      const page = await getPageBySlug(String(req.params.slug));
      if (!page) {
        res.status(404).json({ success: false, message: 'Page content not found.' });
        return;
      }
      res.json({ success: true, message: 'Page content loaded.', data: page });
    })
  );

  router.get(
    '/settings',
    asyncHandler(async (_req, res) => {
      const settings = await getSiteSettings();
      res.json({ success: true, message: 'Settings loaded.', data: settings });
    })
  );

  // ================= ADMIN PROTECTED ROUTES =================
  router.use('/admin', requireAdminAuth);

  // Notifications
  router.get(
    '/admin/notifications',
    asyncHandler(async (_req, res) => {
      const notifications = await listNotifications();
      res.json({ success: true, message: 'Notifications fetched.', data: notifications });
    })
  );

  router.post(
    '/admin/notifications/read',
    asyncHandler(async (_req, res) => {
      await markNotificationsRead();
      res.json({ success: true, message: 'Notifications marked read.' });
    })
  );

  // Upload
  router.post(
    '/admin/upload',
    upload.single('image'),
    asyncHandler(async (req, res) => {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'Please attach an image file.' });
        return;
      }
      const folder = String(req.body?.folder || 'cloud-valley');
      const uploaded = await uploadMediaAsset(req.file.buffer, req.file.originalname, folder);
      res.status(201).json({
        success: true,
        message: 'Image uploaded successfully.',
        data: uploaded,
      });
    })
  );

  // Analytics
  router.get(
    '/admin/analytics',
    asyncHandler(async (req, res) => {
      const range = String(req.query.range || 'year');
      const [allBookings, rooms, messages] = await Promise.all([
        listBookings(),
        listRooms(false),
        listContactMessages(),
      ]);

      const now = new Date();
      let filterStart = new Date(0);
      if (range === 'week') {
        filterStart = new Date(now.getTime() - 7 * 86400000);
      } else if (range === 'month') {
        filterStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      } else if (range === '3months') {
        filterStart = new Date(now.getTime() - 90 * 86400000);
      } else if (range === 'year') {
        filterStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
      }

      const bookings = allBookings.filter((b) => new Date(b.createdAt) >= filterStart);

      const todayIso = normalizeUtcDate(now).toISOString().slice(0, 10);
      const todayArrivals = allBookings.filter(
        (b) => b.status === 'Confirmed' && b.checkIn.slice(0, 10) === todayIso
      ).length;
      const todayDepartures = allBookings.filter(
        (b) => b.status === 'Confirmed' && b.checkOut.slice(0, 10) === todayIso
      ).length;

      const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const monthBookings = allBookings.filter((b) => new Date(b.createdAt) >= monthStart).length;

      // Monthly trend for last 6 months
      const monthlyTrend: { month: string; requests: number; confirmed: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
        const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' });
        const yr = d.getUTCFullYear();
        const mo = d.getUTCMonth();
        const inMonth = allBookings.filter((b) => {
          const bd = new Date(b.createdAt);
          return bd.getUTCFullYear() === yr && bd.getUTCMonth() === mo;
        });
        monthlyTrend.push({
          month: label,
          requests: inMonth.length,
          confirmed: inMonth.filter((b) => b.status === 'Confirmed' || b.status === 'Completed').length,
        });
      }

      const statuses: BookingStatus[] = ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'Rejected'];
      const statusDistribution = statuses.map((status) => ({
        status,
        count: bookings.filter((b) => b.status === status).length,
      }));

      const roomDemand = rooms.map((room) => ({
        roomName: room.name,
        bookings: bookings.filter((b) => b.roomId === room._id).length,
      }));

      res.json({
        success: true,
        message: 'Analytics computed.',
        data: {
          kpis: {
            totalBookings: bookings.length,
            pendingBookings: bookings.filter((b) => b.status === 'Pending').length,
            confirmedBookings: bookings.filter((b) => b.status === 'Confirmed').length,
            cancelledBookings: bookings.filter((b) => b.status === 'Cancelled').length,
            todayArrivals,
            todayDepartures,
            totalRoomCategories: rooms.length,
            monthBookings,
            unreadMessages: messages.filter((m) => m.status === 'Unread').length,
          },
          monthlyTrend,
          statusDistribution,
          roomDemand,
          recentBookings: allBookings.slice(0, 8),
        },
      });
    })
  );

  // Admin Bookings
  router.get(
    '/admin/bookings',
    asyncHandler(async (req, res) => {
      const search = String(req.query.search || '').trim().toLowerCase();
      const status = String(req.query.status || '');
      const roomId = String(req.query.roomId || '');
      const checkInDate = String(req.query.checkIn || '');
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));

      let bookings = await listBookings();

      if (search) {
        bookings = bookings.filter(
          (b) =>
            b.bookingReference.toLowerCase().includes(search) ||
            b.guestName.toLowerCase().includes(search) ||
            b.phone.toLowerCase().includes(search) ||
            b.email.toLowerCase().includes(search)
        );
      }
      if (status && status !== 'All') {
        bookings = bookings.filter((b) => b.status === status);
      }
      if (roomId && roomId !== 'All') {
        bookings = bookings.filter((b) => b.roomId === roomId);
      }
      if (checkInDate) {
        bookings = bookings.filter((b) => b.checkIn.slice(0, 10) === checkInDate);
      }

      const total = bookings.length;
      const paginated = bookings.slice((page - 1) * limit, page * limit);

      res.json({
        success: true,
        message: 'Bookings loaded.',
        data: paginated,
        meta: { page, limit, total },
      });
    })
  );

  router.get(
    '/admin/bookings/:id',
    asyncHandler(async (req, res) => {
      const booking = await getBookingById(String(req.params.id));
      if (!booking) {
        res.status(404).json({ success: false, message: 'Booking not found.' });
        return;
      }
      res.json({ success: true, message: 'Booking loaded.', data: booking });
    })
  );

  router.put(
    '/admin/bookings/:id',
    asyncHandler(async (req, res) => {
      const parsed = bookingUpdateSchema.parse(req.body);
      const existing = await getBookingById(String(req.params.id));
      if (!existing) {
        res.status(404).json({ success: false, message: 'Booking not found.' });
        return;
      }

      const nextCheckIn = parsed.checkIn
        ? normalizeUtcDate(parsed.checkIn).toISOString()
        : existing.checkIn;
      const nextCheckOut = parsed.checkOut
        ? normalizeUtcDate(parsed.checkOut).toISOString()
        : existing.checkOut;

      if (new Date(nextCheckOut) <= new Date(nextCheckIn)) {
        res.status(400).json({
          success: false,
          message: 'Check-out date must be after check-in date.',
        });
        return;
      }

      const room = await getRoomById(existing.roomId);
      const units = parsed.roomsRequested ?? existing.roomsRequested;
      const nights = calculateNights(nextCheckIn, nextCheckOut);
      const estimatedPrice = room ? room.pricePerNight * nights * units : existing.estimatedPrice;

      const updated = await updateBooking(existing._id, {
        ...parsed,
        checkIn: nextCheckIn,
        checkOut: nextCheckOut,
        estimatedPrice,
      });

      res.json({ success: true, message: 'Booking updated.', data: updated });
    })
  );

  router.patch(
    '/admin/bookings/:id/status',
    asyncHandler(async (req, res) => {
      const parsed = bookingStatusSchema.parse(req.body);
      const existing = await getBookingById(String(req.params.id));
      if (!existing) {
        res.status(404).json({ success: false, message: 'Booking not found.' });
        return;
      }

      // Overbooking check before confirming!
      if (parsed.status === 'Confirmed' && existing.status !== 'Confirmed') {
        const availability = await checkAvailabilityForDates(existing.checkIn, existing.checkOut, {
          roomId: existing.roomId,
          excludeBookingId: existing._id,
        });
        const roomAvail = availability[0];
        if (!roomAvail || roomAvail.availableUnits < existing.roomsRequested) {
          res.status(409).json({
            success: false,
            message: `Cannot confirm: only ${roomAvail?.availableUnits ?? 0} unit(s) remain available for ${existing.roomName} on those dates.`,
          });
          return;
        }
      }

      const updated = await updateBooking(existing._id, {
        status: parsed.status,
        ...(parsed.internalNotes !== undefined ? { internalNotes: parsed.internalNotes } : {}),
      });

      if (updated) {
        await notifyBookingStatusChange(updated);
      }

      res.json({
        success: true,
        message: `Booking marked as ${parsed.status}.`,
        data: updated,
      });
    })
  );

  router.delete(
    '/admin/bookings/:id',
    asyncHandler(async (req, res) => {
      const ok = await deleteBooking(String(req.params.id));
      if (!ok) {
        res.status(404).json({ success: false, message: 'Booking not found.' });
        return;
      }
      res.json({ success: true, message: 'Booking deleted.' });
    })
  );

  // Admin Rooms
  router.get(
    '/admin/rooms',
    asyncHandler(async (_req, res) => {
      const rooms = await listRooms(false);
      res.json({ success: true, message: 'Admin rooms fetched.', data: rooms });
    })
  );

  router.post(
    '/admin/rooms',
    asyncHandler(async (req, res) => {
      const parsed = roomSchema.parse(req.body);
      const created = await createRoom(parsed);
      res.status(201).json({ success: true, message: 'Room category created.', data: created });
    })
  );

  router.put(
    '/admin/rooms/:id',
    asyncHandler(async (req, res) => {
      const parsed = roomSchema.partial().parse(req.body);
      const updated = await updateRoom(String(req.params.id), parsed);
      if (!updated) {
        res.status(404).json({ success: false, message: 'Room not found.' });
        return;
      }
      res.json({ success: true, message: 'Room updated.', data: updated });
    })
  );

  router.patch(
    '/admin/rooms/:id/status',
    asyncHandler(async (req, res) => {
      const existing = await getRoomById(String(req.params.id));
      if (!existing) {
        res.status(404).json({ success: false, message: 'Room not found.' });
        return;
      }
      const isActive = typeof req.body?.isActive === 'boolean' ? req.body.isActive : !existing.isActive;
      const updated = await updateRoom(existing._id, { isActive });
      res.json({ success: true, message: 'Room status toggled.', data: updated });
    })
  );

  router.delete(
    '/admin/rooms/:id',
    asyncHandler(async (req, res) => {
      const ok = await deleteRoom(String(req.params.id));
      if (!ok) {
        res.status(404).json({ success: false, message: 'Room not found.' });
        return;
      }
      res.json({ success: true, message: 'Room deleted.' });
    })
  );

  // Admin Availability & Blocked Dates
  router.get(
    '/admin/availability',
    asyncHandler(async (_req, res) => {
      const [rooms, bookings, blockedDates] = await Promise.all([
        listRooms(false),
        listBookings(),
        listBlockedDates(),
      ]);
      res.json({
        success: true,
        message: 'Availability calendar loaded.',
        data: {
          rooms,
          bookings: bookings.filter((b) => b.status === 'Confirmed' || b.status === 'Pending'),
          blockedDates,
        },
      });
    })
  );

  router.post(
    '/admin/availability/block',
    asyncHandler(async (req, res) => {
      const parsed = blockedDateSchema.parse(req.body);
      const room = await getRoomById(parsed.roomId);
      if (!room) {
        res.status(404).json({ success: false, message: 'Room not found.' });
        return;
      }
      const created = await createBlockedDate({
        roomId: room._id,
        roomName: room.name,
        startDate: normalizeUtcDate(parsed.startDate).toISOString(),
        endDate: normalizeUtcDate(parsed.endDate).toISOString(),
        unitsBlocked: Math.min(parsed.unitsBlocked, room.totalUnits),
        reason: parsed.reason,
      });
      res.status(201).json({ success: true, message: 'Dates blocked.', data: created });
    })
  );

  router.delete(
    '/admin/availability/block/:id',
    asyncHandler(async (req, res) => {
      const ok = await deleteBlockedDate(String(req.params.id));
      if (!ok) {
        res.status(404).json({ success: false, message: 'Blocked entry not found.' });
        return;
      }
      res.json({ success: true, message: 'Date block removed.' });
    })
  );

  // Admin Gallery
  router.get(
    '/admin/gallery',
    asyncHandler(async (_req, res) => {
      const items = await listGallery(false);
      res.json({ success: true, message: 'Admin gallery fetched.', data: items });
    })
  );

  router.post(
    '/admin/gallery',
    asyncHandler(async (req, res) => {
      const parsed = gallerySchema.parse(req.body);
      const created = await createGalleryItem(parsed);
      res.status(201).json({ success: true, message: 'Gallery image added.', data: created });
    })
  );

  router.put(
    '/admin/gallery/:id',
    asyncHandler(async (req, res) => {
      const parsed = gallerySchema.partial().parse(req.body);
      const updated = await updateGalleryItem(String(req.params.id), parsed);
      if (!updated) {
        res.status(404).json({ success: false, message: 'Gallery item not found.' });
        return;
      }
      res.json({ success: true, message: 'Gallery item updated.', data: updated });
    })
  );

  router.delete(
    '/admin/gallery/:id',
    asyncHandler(async (req, res) => {
      const existing = await getGalleryById(String(req.params.id));
      if (!existing) {
        res.status(404).json({ success: false, message: 'Gallery item not found.' });
        return;
      }
      await deleteMediaAsset(existing.cloudinaryPublicId);
      await deleteGalleryItem(existing._id);
      res.json({ success: true, message: 'Gallery item deleted.' });
    })
  );

  // Admin Experiences
  router.get(
    '/admin/experiences',
    asyncHandler(async (_req, res) => {
      const items = await listExperiences(false);
      res.json({ success: true, message: 'Experiences fetched.', data: items });
    })
  );

  router.post(
    '/admin/experiences',
    asyncHandler(async (req, res) => {
      const parsed = experienceSchema.parse(req.body);
      const created = await createExperience(parsed);
      res.status(201).json({ success: true, message: 'Experience created.', data: created });
    })
  );

  router.put(
    '/admin/experiences/:id',
    asyncHandler(async (req, res) => {
      const parsed = experienceSchema.partial().parse(req.body);
      const updated = await updateExperience(String(req.params.id), parsed);
      if (!updated) {
        res.status(404).json({ success: false, message: 'Experience not found.' });
        return;
      }
      res.json({ success: true, message: 'Experience updated.', data: updated });
    })
  );

  router.delete(
    '/admin/experiences/:id',
    asyncHandler(async (req, res) => {
      const ok = await deleteExperience(String(req.params.id));
      if (!ok) {
        res.status(404).json({ success: false, message: 'Experience not found.' });
        return;
      }
      res.json({ success: true, message: 'Experience deleted.' });
    })
  );

  // Admin Dining
  router.get(
    '/admin/dining',
    asyncHandler(async (_req, res) => {
      const items = await listDining(false);
      res.json({ success: true, message: 'Dining items fetched.', data: items });
    })
  );

  router.post(
    '/admin/dining',
    asyncHandler(async (req, res) => {
      const parsed = diningSchema.parse(req.body);
      const created = await createDiningItem(parsed);
      res.status(201).json({ success: true, message: 'Dining item created.', data: created });
    })
  );

  router.put(
    '/admin/dining/:id',
    asyncHandler(async (req, res) => {
      const parsed = diningSchema.partial().parse(req.body);
      const updated = await updateDiningItem(String(req.params.id), parsed);
      if (!updated) {
        res.status(404).json({ success: false, message: 'Dining item not found.' });
        return;
      }
      res.json({ success: true, message: 'Dining item updated.', data: updated });
    })
  );

  router.delete(
    '/admin/dining/:id',
    asyncHandler(async (req, res) => {
      const ok = await deleteDiningItem(String(req.params.id));
      if (!ok) {
        res.status(404).json({ success: false, message: 'Dining item not found.' });
        return;
      }
      res.json({ success: true, message: 'Dining item deleted.' });
    })
  );

  // Admin Reviews
  router.get(
    '/admin/reviews',
    asyncHandler(async (_req, res) => {
      const items = await listReviews(false);
      res.json({ success: true, message: 'Reviews fetched.', data: items });
    })
  );

  router.post(
    '/admin/reviews',
    asyncHandler(async (req, res) => {
      const parsed = reviewSchema.parse(req.body);
      const created = await createReview(parsed);
      res.status(201).json({ success: true, message: 'Review added.', data: created });
    })
  );

  router.put(
    '/admin/reviews/:id',
    asyncHandler(async (req, res) => {
      const parsed = reviewSchema.partial().parse(req.body);
      const updated = await updateReview(String(req.params.id), parsed);
      if (!updated) {
        res.status(404).json({ success: false, message: 'Review not found.' });
        return;
      }
      res.json({ success: true, message: 'Review updated.', data: updated });
    })
  );

  router.delete(
    '/admin/reviews/:id',
    asyncHandler(async (req, res) => {
      const ok = await deleteReview(String(req.params.id));
      if (!ok) {
        res.status(404).json({ success: false, message: 'Review not found.' });
        return;
      }
      res.json({ success: true, message: 'Review deleted.' });
    })
  );

  // Admin Messages
  router.get(
    '/admin/messages',
    asyncHandler(async (req, res) => {
      const status = String(req.query.status || '');
      const search = String(req.query.search || '').trim().toLowerCase();
      let items = await listContactMessages();
      if (status && status !== 'All') {
        items = items.filter((m) => m.status === status);
      }
      if (search) {
        items = items.filter(
          (m) =>
            m.name.toLowerCase().includes(search) ||
            m.email.toLowerCase().includes(search) ||
            m.subject.toLowerCase().includes(search) ||
            m.phone.toLowerCase().includes(search)
        );
      }
      res.json({ success: true, message: 'Messages fetched.', data: items });
    })
  );

  router.patch(
    '/admin/messages/:id/status',
    asyncHandler(async (req, res) => {
      const parsed = messageStatusSchema.parse(req.body);
      const updated = await updateContactMessage(String(req.params.id), { status: parsed.status });
      if (!updated) {
        res.status(404).json({ success: false, message: 'Message not found.' });
        return;
      }
      res.json({ success: true, message: 'Message status updated.', data: updated });
    })
  );

  router.delete(
    '/admin/messages/:id',
    asyncHandler(async (req, res) => {
      const ok = await deleteContactMessage(String(req.params.id));
      if (!ok) {
        res.status(404).json({ success: false, message: 'Message not found.' });
        return;
      }
      res.json({ success: true, message: 'Message deleted.' });
    })
  );

  // Admin FAQs
  router.get(
    '/admin/faqs',
    asyncHandler(async (_req, res) => {
      const items = await listFAQs(false);
      res.json({ success: true, message: 'FAQs fetched.', data: items });
    })
  );

  router.post(
    '/admin/faqs',
    asyncHandler(async (req, res) => {
      const parsed = faqSchema.parse(req.body);
      const created = await createFAQ(parsed);
      res.status(201).json({ success: true, message: 'FAQ added.', data: created });
    })
  );

  router.put(
    '/admin/faqs/:id',
    asyncHandler(async (req, res) => {
      const parsed = faqSchema.partial().parse(req.body);
      const updated = await updateFAQ(String(req.params.id), parsed);
      if (!updated) {
        res.status(404).json({ success: false, message: 'FAQ not found.' });
        return;
      }
      res.json({ success: true, message: 'FAQ updated.', data: updated });
    })
  );

  router.delete(
    '/admin/faqs/:id',
    asyncHandler(async (req, res) => {
      const ok = await deleteFAQ(String(req.params.id));
      if (!ok) {
        res.status(404).json({ success: false, message: 'FAQ not found.' });
        return;
      }
      res.json({ success: true, message: 'FAQ deleted.' });
    })
  );

  // Admin CMS & Settings
  router.get(
    '/admin/content',
    asyncHandler(async (_req, res) => {
      const pages = await listPages();
      res.json({ success: true, message: 'CMS pages loaded.', data: pages });
    })
  );

  router.put(
    '/admin/content',
    asyncHandler(async (req, res) => {
      const parsed = cmsUpdateSchema.parse(req.body);
      const updated = await upsertPage(parsed.slug, parsed);
      res.json({ success: true, message: 'Page content saved.', data: updated });
    })
  );

  router.put(
    '/admin/settings',
    asyncHandler(async (req, res) => {
      const parsed = settingsSchema.parse(req.body);
      const updated = await updateSiteSettings(parsed);
      res.json({ success: true, message: 'Site settings saved.', data: updated });
    })
  );

  return router;
}

export function registerSeoRoutes(app: {
  get: (path: string, handler: (req: Request, res: Response) => void) => void;
}) {
  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain').send(
      `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nSitemap: ${env.PUBLIC_SITE_URL}/sitemap.xml\n`
    );
  });

  app.get('/sitemap.xml', async (_req, res) => {
    const rooms = await listRooms(true);
    const staticPaths = [
      '/',
      '/about',
      '/rooms',
      '/booking',
      '/gallery',
      '/experiences',
      '/dining',
      '/location',
      '/contact',
      '/faq',
      '/privacy-policy',
      '/terms',
      '/cancellation-policy',
    ];
    const urls = [
      ...staticPaths.map((p) => `${env.PUBLIC_SITE_URL}${p}`),
      ...rooms.map((r) => `${env.PUBLIC_SITE_URL}/rooms/${r.slug}`),
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map((u) => `  <url><loc>${u}</loc></url>`)
      .join('\n')}\n</urlset>`;
    res.type('application/xml').send(xml);
  });
}
