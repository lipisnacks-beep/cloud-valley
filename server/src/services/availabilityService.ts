import { listBlockedDates, listBookings, listRooms } from './dataStore.ts';
import type { AvailabilityResult } from '../../../shared/types/index.ts';

export function normalizeUtcDate(input: string | Date): Date {
  const d = new Date(input);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function calculateNights(checkIn: string | Date, checkOut: string | Date): number {
  const start = normalizeUtcDate(checkIn).getTime();
  const end = normalizeUtcDate(checkOut).getTime();
  return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
}

/**
 * PRD Section 15 Overlap Condition:
 * existingCheckIn < requestedCheckOut && existingCheckOut > requestedCheckIn
 */
export function rangesOverlap(
  existingStart: string | Date,
  existingEnd: string | Date,
  requestedStart: string | Date,
  requestedEnd: string | Date
): boolean {
  const eStart = normalizeUtcDate(existingStart).getTime();
  const eEnd = normalizeUtcDate(existingEnd).getTime();
  const rStart = normalizeUtcDate(requestedStart).getTime();
  const rEnd = normalizeUtcDate(requestedEnd).getTime();
  return eStart < rEnd && eEnd > rStart;
}

export async function checkAvailabilityForDates(
  checkInStr: string,
  checkOutStr: string,
  options?: { roomId?: string; excludeBookingId?: string }
): Promise<AvailabilityResult[]> {
  const nights = calculateNights(checkInStr, checkOutStr);
  const [rooms, bookings, blocked] = await Promise.all([
    listRooms(true),
    listBookings(),
    listBlockedDates(),
  ]);

  const targetRooms = options?.roomId
    ? rooms.filter((r) => r._id === options.roomId || r.slug === options.roomId)
    : rooms;

  return targetRooms.map((room) => {
    const overlappingConfirmed = bookings.filter(
      (b) =>
        b._id !== options?.excludeBookingId &&
        b.roomId === room._id &&
        b.status === 'Confirmed' &&
        rangesOverlap(b.checkIn, b.checkOut, checkInStr, checkOutStr)
    );

    const bookedUnits = overlappingConfirmed.reduce((sum, b) => sum + (b.roomsRequested || 1), 0);

    const overlappingBlocks = blocked.filter(
      (blk) =>
        blk.roomId === room._id &&
        rangesOverlap(blk.startDate, blk.endDate, checkInStr, checkOutStr)
    );

    const blockedUnits = overlappingBlocks.reduce((sum, blk) => sum + (blk.unitsBlocked || 1), 0);

    const availableUnits = Math.max(0, room.totalUnits - bookedUnits - blockedUnits);

    return {
      roomId: room._id,
      roomName: room.name,
      slug: room.slug,
      totalUnits: room.totalUnits,
      bookedUnits,
      blockedUnits,
      availableUnits,
      isAvailable: availableUnits > 0,
      pricePerNight: room.pricePerNight,
      nights,
      estimatedTotal: room.pricePerNight * nights,
    };
  });
}
