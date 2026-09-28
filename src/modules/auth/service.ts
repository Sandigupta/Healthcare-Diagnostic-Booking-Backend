import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { users } from '../../db/schema/index.js';
import { AppError } from '../../utils/errors.js';
import { signAccessToken } from '../../utils/jwt.js';
import { logger } from '../../utils/logger.js';
import type { LoginInput, SignupInput } from './schema.js';

const SALT_ROUNDS = 10;

function toPublicUser(user: typeof users.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

export async function signup(input: SignupInput) {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email.toLowerCase()))
    .limit(1);

  if (existing.length > 0) {
    throw new AppError(409, 'EMAIL_ALREADY_EXISTS', 'Email is already registered');
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const [user] = await db
    .insert(users)
    .values({
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
    })
    .returning();

  logger.info({ event: 'user_signed_up', userId: user.id }, 'User signed up');

  return toPublicUser(user);
}

export async function login(input: LoginInput) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email.toLowerCase()))
    .limit(1);

  if (!user) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const accessToken = signAccessToken({ userId: user.id, email: user.email });

  logger.info({ event: 'user_logged_in', userId: user.id }, 'User logged in');

  return { accessToken };
}
