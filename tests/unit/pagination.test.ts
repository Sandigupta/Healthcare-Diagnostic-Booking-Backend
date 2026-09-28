import { describe, expect, it } from 'vitest';
import {
  buildPaginationMeta,
  paginationOffset,
  paginationQuerySchema,
} from '../../src/utils/pagination.js';

describe('pagination', () => {
  it('applies defaults', () => {
    const parsed = paginationQuerySchema.parse({});
    expect(parsed).toEqual({ page: 1, limit: 10 });
  });

  it('rejects limit above 100', () => {
    const result = paginationQuerySchema.safeParse({ page: 1, limit: 101 });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive page', () => {
    const result = paginationQuerySchema.safeParse({ page: 0, limit: 10 });
    expect(result.success).toBe(false);
  });

  it('builds meta and offset', () => {
    expect(buildPaginationMeta(1, 10, 42)).toEqual({
      page: 1,
      limit: 10,
      total: 42,
      totalPages: 5,
    });
    expect(buildPaginationMeta(1, 10, 0)).toEqual({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    });
    expect(paginationOffset(3, 10)).toBe(20);
  });
});
