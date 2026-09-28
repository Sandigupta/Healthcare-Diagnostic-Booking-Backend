import { count, eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { diagnosticTests } from '../../db/schema/index.js';
import { AppError } from '../../utils/errors.js';
import { buildPaginationMeta, paginationOffset, type PaginationQuery } from '../../utils/pagination.js';
import type { CreateTestInput } from './schema.js';

export async function listTests(pagination: PaginationQuery) {
  const { page, limit } = pagination;
  const offset = paginationOffset(page, limit);

  const [rows, totalResult] = await Promise.all([
    db
      .select()
      .from(diagnosticTests)
      .orderBy(diagnosticTests.id)
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(diagnosticTests),
  ]);

  return {
    data: rows,
    pagination: buildPaginationMeta(page, limit, Number(totalResult[0]?.value ?? 0)),
  };
}

export async function getTestById(id: number) {
  const [test] = await db
    .select()
    .from(diagnosticTests)
    .where(eq(diagnosticTests.id, id))
    .limit(1);

  if (!test) {
    throw new AppError(404, 'TEST_NOT_FOUND', 'Diagnostic test not found');
  }

  return test;
}

export async function createTest(input: CreateTestInput) {
  const [test] = await db
    .insert(diagnosticTests)
    .values({
      name: input.name,
      description: input.description,
    })
    .returning();

  return test;
}
