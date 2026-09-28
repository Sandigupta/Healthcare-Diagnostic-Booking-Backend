import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
