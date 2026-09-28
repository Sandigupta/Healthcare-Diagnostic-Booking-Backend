import { describe, expect, it } from 'vitest';
import {
  WEBHOOK_MAX_RETRIES,
  generatePaymentReference,
  simulatePaymentOutcome,
} from '../../src/modules/payments/simulate.js';

describe('payment simulation helpers', () => {
  it('respects forced outcome', () => {
    expect(simulatePaymentOutcome('SUCCESS')).toBe('SUCCESS');
    expect(simulatePaymentOutcome('FAILED')).toBe('FAILED');
  });

  it('generates unique-looking payment references', () => {
    const a = generatePaymentReference();
    const b = generatePaymentReference();
    expect(a).toMatch(/^pay_/);
    expect(b).toMatch(/^pay_/);
    expect(a).not.toBe(b);
  });

  it('defines a bounded webhook retry count', () => {
    expect(WEBHOOK_MAX_RETRIES).toBeGreaterThanOrEqual(1);
    expect(WEBHOOK_MAX_RETRIES).toBeLessThanOrEqual(5);
  });
});
