import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || '8080', 10),
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  COOKIE_SECURE: (process.env.COOKIE_SECURE || 'false') === 'true'
};
