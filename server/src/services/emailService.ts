import nodemailer from 'nodemailer';
import { env, isSmtpConfigured } from '../config/env.ts';
import { addNotification, getSiteSettings } from './dataStore.ts';
import type { Booking } from '../../../shared/types/index.ts';

function formatDateDisplay(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

async function sendEmailSafe(to: string, subject: string, html: string): Promise<boolean> {
  if (!isSmtpConfigured) {
    return false;
  }
  try {
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
    });
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.warn('[EmailService] Email delivery skipped/failed:', err);
    return false;
  }
}

export async function notifyNewBooking(booking: Booking): Promise<void> {
  const settings = await getSiteSettings();
  const checkIn = formatDateDisplay(booking.checkIn);
  const checkOut = formatDateDisplay(booking.checkOut);

  await addNotification({
    title: 'New Booking Request',
    message: `${booking.bookingReference} · ${booking.guestName} requested ${booking.roomsRequested}x ${booking.roomName} (${checkIn} – ${checkOut}).`,
    type: 'booking',
    referenceId: booking.bookingReference,
  });

  if (!settings.emailNotificationsEnabled) return;

  const adminLink = `${env.PUBLIC_SITE_URL}/admin/bookings/${booking._id}`;
  await sendEmailSafe(
    settings.email,
    `[CLOUD VALLEY] New Booking Request ${booking.bookingReference}`,
    `
      <h2>New Booking Inquiry Received</h2>
      <p><strong>Reference:</strong> ${booking.bookingReference}</p>
      <p><strong>Guest:</strong> ${booking.guestName} (${booking.phone} · ${booking.email})</p>
      <p><strong>Dates:</strong> ${checkIn} to ${checkOut}</p>
      <p><strong>Room:</strong> ${booking.roomsRequested}x ${booking.roomName}</p>
      <p><strong>Guests:</strong> ${booking.adults} Adults, ${booking.children} Children</p>
      <p><strong>Special Requests:</strong> ${booking.specialRequests || 'None'}</p>
      <p><a href="${adminLink}">Review in Admin Dashboard</a></p>
    `
  );

  await sendEmailSafe(
    booking.email,
    `Your CLOUD VALLEY Booking Request (${booking.bookingReference})`,
    `
      <h2>Thank you, ${booking.guestName}</h2>
      <p>We have received your stay request at CLOUD VALLEY, Samalbong. Your request is currently <strong>Pending</strong> availability verification by our reservations team.</p>
      <p><strong>Reference ID:</strong> ${booking.bookingReference}</p>
      <p><strong>Check-in:</strong> ${checkIn} (from ${settings.checkInTime})</p>
      <p><strong>Check-out:</strong> ${checkOut} (by ${settings.checkOutTime})</p>
      <p><strong>Accommodation:</strong> ${booking.roomsRequested}x ${booking.roomName}</p>
      <p><strong>Contact:</strong> ${settings.phone} · ${settings.email}</p>
    `
  );
}

export async function notifyBookingStatusChange(booking: Booking): Promise<void> {
  const settings = await getSiteSettings();
  if (!settings.emailNotificationsEnabled) return;

  const checkIn = formatDateDisplay(booking.checkIn);
  const checkOut = formatDateDisplay(booking.checkOut);

  await sendEmailSafe(
    booking.email,
    `Booking Update (${booking.bookingReference}): ${booking.status}`,
    `
      <h2>CLOUD VALLEY Reservation Update</h2>
      <p>Dear ${booking.guestName},</p>
      <p>Your booking <strong>${booking.bookingReference}</strong> status is now: <strong>${booking.status}</strong>.</p>
      <p><strong>Dates:</strong> ${checkIn} to ${checkOut}</p>
      <p><strong>Room:</strong> ${booking.roomsRequested}x ${booking.roomName}</p>
      <p><strong>Check-in Time:</strong> ${settings.checkInTime}</p>
      <p>Questions? Reach us at ${settings.phone} or ${settings.email}.</p>
    `
  );
}
