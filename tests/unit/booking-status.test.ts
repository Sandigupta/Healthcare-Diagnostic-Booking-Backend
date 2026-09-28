import { describe, expect, it } from 'vitest';
import { AppError } from '../../src/utils/errors.js';
import {
  assertBookingTransition,
  canCancelBooking,
  canPayForBooking,
} from '../../src/modules/bookings/status.js';

describe('booking status transitions', () => {
  it('allows PENDING → CONFIRMED | FAILED | CANCELLED', () => {
    expect(() => assertBookingTransition('PENDING', 'CONFIRMED')).not.toThrow();
    expect(() => assertBookingTransition('PENDING', 'FAILED')).not.toThrow();
    expect(() => assertBookingTransition('PENDING', 'CANCELLED')).not.toThrow();
  });

  it('allows CONFIRMED → CANCELLED only', () => {
    expect(() => assertBookingTransition('CONFIRMED', 'CANCELLED')).not.toThrow();
    expect(() => assertBookingTransition('CONFIRMED', 'PENDING')).toThrow(AppError);
    expect(() => assertBookingTransition('CONFIRMED', 'FAILED')).toThrow(AppError);
  });

  it('rejects transitions from FAILED or CANCELLED', () => {
    expect(() => assertBookingTransition('FAILED', 'CONFIRMED')).toThrow(AppError);
    expect(() => assertBookingTransition('CANCELLED', 'CONFIRMED')).toThrow(AppError);
  });

  it('canCancelBooking and canPayForBooking helpers', () => {
    expect(canCancelBooking('PENDING')).toBe(true);
    expect(canCancelBooking('CONFIRMED')).toBe(true);
    expect(canCancelBooking('FAILED')).toBe(false);
    expect(canCancelBooking('CANCELLED')).toBe(false);

    expect(canPayForBooking('PENDING')).toBe(true);
    expect(canPayForBooking('CONFIRMED')).toBe(false);
    expect(canPayForBooking('CANCELLED')).toBe(false);
  });
});
