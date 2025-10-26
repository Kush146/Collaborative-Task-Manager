import { z } from 'zod';

export const RegisterDto = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(8).max(100)
});

export const LoginDto = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100)
});

export const UpdateProfileDto = z.object({
  name: z.string().min(1).max(100)
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileDto>;
export type RegisterDto = z.infer<typeof RegisterDto>;
export type LoginDto = z.infer<typeof LoginDto>;
