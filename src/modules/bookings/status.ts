import type { BookingStatus } from '../../db/schema/index.js';
import { AppError } from '../../utils/errors.js';

const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ['CONFIRMED', 'FAILED', 'CANCELLED'],
  CONFIRMED: ['CANCELLED'],
  FAILED: [],
  CANCELLED: [],
};

export function assertBookingTransition(
  current: BookingStatus,
  next: BookingStatus,
): void {
  const allowed = ALLOWED_TRANSITIONS[current];
  if (!allowed.includes(next)) {
    throw new AppError(
      409,
      'INVALID_STATUS_TRANSITION',
      `Cannot transition booking from ${current} to ${next}`,
    );
  }
}

export function canCancelBooking(status: BookingStatus): boolean {
  return status === 'PENDING' || status === 'CONFIRMED';
}

export function canPayForBooking(status: BookingStatus): boolean {
  return status === 'PENDING';
}
