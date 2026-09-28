import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  numeric,
  pgEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const bookingStatusEnum = pgEnum('booking_status', [
  'PENDING',
  'CONFIRMED',
  'FAILED',
  'CANCELLED',
]);

export const paymentStatusEnum = pgEnum('payment_status', ['SUCCESS', 'FAILED']);

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('users_email_unique').on(table.email)],
);

export const diagnosticCentres = pgTable('diagnostic_centres', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  location: varchar('location', { length: 500 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const diagnosticTests = pgTable('diagnostic_tests', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const centreTests = pgTable(
  'centre_tests',
  {
    id: serial('id').primaryKey(),
    centreId: integer('centre_id')
      .notNull()
      .references(() => diagnosticCentres.id, { onDelete: 'cascade' }),
    testId: integer('test_id')
      .notNull()
      .references(() => diagnosticTests.id, { onDelete: 'cascade' }),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('centre_tests_centre_test_unique').on(table.centreId, table.testId),
    index('centre_tests_centre_id_idx').on(table.centreId),
    index('centre_tests_test_id_idx').on(table.testId),
  ],
);

export const bookings = pgTable(
  'bookings',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    testId: integer('test_id')
      .notNull()
      .references(() => diagnosticTests.id),
    centreId: integer('centre_id')
      .notNull()
      .references(() => diagnosticCentres.id),
    appointmentDateTime: timestamp('appointment_date_time', { withTimezone: true }).notNull(),
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    status: bookingStatusEnum('status').notNull().default('PENDING'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('bookings_user_id_idx').on(table.userId),
    index('bookings_status_idx').on(table.status),
  ],
);

export const payments = pgTable(
  'payments',
  {
    id: serial('id').primaryKey(),
    bookingId: integer('booking_id')
      .notNull()
      .references(() => bookings.id, { onDelete: 'cascade' }),
    paymentReference: varchar('payment_reference', { length: 100 }).notNull(),
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    status: paymentStatusEnum('status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('payments_payment_reference_unique').on(table.paymentReference),
    index('payments_booking_id_idx').on(table.bookingId),
  ],
);

export const webhookEvents = pgTable(
  'webhook_events',
  {
    id: serial('id').primaryKey(),
    eventId: varchar('event_id', { length: 100 }).notNull(),
    paymentId: varchar('payment_id', { length: 100 }).notNull(),
    bookingId: integer('booking_id').references(() => bookings.id),
    status: paymentStatusEnum('status').notNull(),
    retryCount: integer('retry_count').notNull().default(0),
    lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('webhook_events_event_id_unique').on(table.eventId)],
);

export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
}));

export const diagnosticCentresRelations = relations(diagnosticCentres, ({ many }) => ({
  centreTests: many(centreTests),
  bookings: many(bookings),
}));

export const diagnosticTestsRelations = relations(diagnosticTests, ({ many }) => ({
  centreTests: many(centreTests),
  bookings: many(bookings),
}));

export const centreTestsRelations = relations(centreTests, ({ one }) => ({
  centre: one(diagnosticCentres, {
    fields: [centreTests.centreId],
    references: [diagnosticCentres.id],
  }),
  test: one(diagnosticTests, {
    fields: [centreTests.testId],
    references: [diagnosticTests.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, { fields: [bookings.userId], references: [users.id] }),
  test: one(diagnosticTests, { fields: [bookings.testId], references: [diagnosticTests.id] }),
  centre: one(diagnosticCentres, {
    fields: [bookings.centreId],
    references: [diagnosticCentres.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, { fields: [payments.bookingId], references: [bookings.id] }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type DiagnosticCentre = typeof diagnosticCentres.$inferSelect;
export type DiagnosticTest = typeof diagnosticTests.$inferSelect;
export type CentreTest = typeof centreTests.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type BookingStatus = (typeof bookingStatusEnum.enumValues)[number];
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];
