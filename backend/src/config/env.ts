import 'dotenv/config'
import { z } from 'zod'

const schema = z.object({
  // server
  PORT: z.coerce.number().default(8080),

  // auth
  JWT_SECRET: z.string(),

  // CORS
  CLIENT_ORIGIN: z.string().optional(),   // legacy single-origin
  CORS_ORIGINS: z.string().optional(),    // comma-separated list of origins

  // cookies
  COOKIE_SECURE: z.coerce.boolean().default(false),
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
})

export const env = schema.parse(process.env)
export type Env = z.infer<typeof schema>
