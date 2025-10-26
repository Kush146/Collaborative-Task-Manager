import { prisma } from '../../utils/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = (password: string, hash: string) => bcrypt.compare(password, hash);

export const signJwt = (userId: string) => {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: '7d' });
};

export const findUserByEmail = (email: string) => prisma.user.findUnique({ where: { email } });

export const createUser = async (email: string, name: string, password: string) => {
  const hashed = await hashPassword(password);
  return prisma.user.create({ data: { email, name, password: hashed } });
};

export const userService = {
  findById: async (id: string) => prisma.user.findUnique({ where: { id } }),
  findByEmail: async (email: string) => prisma.user.findUnique({ where: { email } }),
  create: async (data: { name: string; email: string; password: string }) =>
    prisma.user.create({ data }),
}
