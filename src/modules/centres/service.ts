import { and, count, eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { centreTests, diagnosticCentres, diagnosticTests } from '../../db/schema/index.js';
import { AppError } from '../../utils/errors.js';
import { buildPaginationMeta, paginationOffset, type PaginationQuery } from '../../utils/pagination.js';
import type { AttachTestInput, CreateCentreInput } from './schema.js';

export async function listCentres(pagination: PaginationQuery) {
  const { page, limit } = pagination;
  const offset = paginationOffset(page, limit);

  const [rows, totalResult] = await Promise.all([
    db
      .select()
      .from(diagnosticCentres)
      .orderBy(diagnosticCentres.id)
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(diagnosticCentres),
  ]);

  return {
    data: rows,
    pagination: buildPaginationMeta(page, limit, Number(totalResult[0]?.value ?? 0)),
  };
}

export async function getCentreById(id: number) {
  const [centre] = await db
    .select()
    .from(diagnosticCentres)
    .where(eq(diagnosticCentres.id, id))
    .limit(1);

  if (!centre) {
    throw new AppError(404, 'CENTRE_NOT_FOUND', 'Diagnostic centre not found');
  }

  return centre;
}

export async function createCentre(input: CreateCentreInput) {
  const [centre] = await db
    .insert(diagnosticCentres)
    .values({ name: input.name, location: input.location })
    .returning();

  return centre;
}

export async function listCentreTests(centreId: number, pagination: PaginationQuery) {
  await getCentreById(centreId);

  const { page, limit } = pagination;
  const offset = paginationOffset(page, limit);

  const [rows, totalResult] = await Promise.all([
    db
      .select({
        id: centreTests.id,
        centreId: centreTests.centreId,
        testId: centreTests.testId,
        price: centreTests.price,
        testName: diagnosticTests.name,
        testDescription: diagnosticTests.description,
        createdAt: centreTests.createdAt,
      })
      .from(centreTests)
      .innerJoin(diagnosticTests, eq(centreTests.testId, diagnosticTests.id))
      .where(eq(centreTests.centreId, centreId))
      .orderBy(centreTests.id)
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(centreTests).where(eq(centreTests.centreId, centreId)),
  ]);

  return {
    data: rows,
    pagination: buildPaginationMeta(page, limit, Number(totalResult[0]?.value ?? 0)),
  };
}

export async function attachTestToCentre(centreId: number, input: AttachTestInput) {
  await getCentreById(centreId);

  const [test] = await db
    .select()
    .from(diagnosticTests)
    .where(eq(diagnosticTests.id, input.testId))
    .limit(1);

  if (!test) {
    throw new AppError(404, 'TEST_NOT_FOUND', 'Diagnostic test not found');
  }

  const existing = await db
    .select()
    .from(centreTests)
    .where(and(eq(centreTests.centreId, centreId), eq(centreTests.testId, input.testId)))
    .limit(1);

  if (existing.length > 0) {
    throw new AppError(409, 'CENTRE_TEST_EXISTS', 'Centre already offers this test');
  }

  const [offer] = await db
    .insert(centreTests)
    .values({
      centreId,
      testId: input.testId,
      price: input.price.toFixed(2),
    })
    .returning();

  return {
    ...offer,
    testName: test.name,
  };
}

export async function getCentreTestOffer(centreId: number, testId: number) {
  const [offer] = await db
    .select()
    .from(centreTests)
    .where(and(eq(centreTests.centreId, centreId), eq(centreTests.testId, testId)))
    .limit(1);

  return offer ?? null;
}
