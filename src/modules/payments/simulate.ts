import type { PaymentStatus } from '../../db/schema/index.js';

/**
 * Simulates a payment gateway outcome.
 * Default: ~70% SUCCESS. Tests can inject forceOutcome or stub this function.
 */
export function simulatePaymentOutcome(forceOutcome?: PaymentStatus): PaymentStatus {
  if (forceOutcome) {
    return forceOutcome;
  }
  return Math.random() < 0.7 ? 'SUCCESS' : 'FAILED';
}

export function generatePaymentReference(): string {
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `pay_${stamp}_${rand}`;
}

export const WEBHOOK_MAX_RETRIES = 3;
export const WEBHOOK_RETRY_DELAY_MS = 50;

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
