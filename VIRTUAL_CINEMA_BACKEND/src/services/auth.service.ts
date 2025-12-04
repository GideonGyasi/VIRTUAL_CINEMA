import prisma from '../prisma/client';
import logger from '../utils/logger';
import { SocketUser } from '../types';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

export class AuthService {
  // Database-backed user creation for email/password auth
  static async register(username: string, email: string, password: string) {
    try {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        throw new Error('Email already registered');
      }

      const hashed = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          name: username,
          email,
          password: hashed,
        },
      });

      const token = this.generateToken(user.id, user.email);

      return { user: this.mapToSocketUser(user), token };
    } catch (error) {
      logger.error('Register error', error);
      throw error;
    }
  }

  static async login(email: string, password: string) {
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) throw new Error('Invalid credentials');

      const ok = await bcrypt.compare(password, user.password);
      if (!ok) throw new Error('Invalid credentials');

      const token = this.generateToken(user.id, user.email);
      return { user: this.mapToSocketUser(user), token };
    } catch (error) {
      logger.error('Login error', error);
      throw error;
    }
  }

  static generateToken(userId: string, email?: string) {
    return jwt.sign({ uid: userId, email }, JWT_SECRET, { expiresIn: '7d' });
  }

  static verifyToken(token: string) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as any;
      return payload;
    } catch (error) {
      logger.error('JWT verification failed', error);
      throw new Error('Invalid token');
    }
  }

  static mapToSocketUser(user: any): SocketUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      photoURL: user.photoURL || undefined,
    };
  }

  static async getUserById(userId: string): Promise<SocketUser | null> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return null;
      return this.mapToSocketUser(user);
    } catch (error) {
      logger.error('Error getting user by ID', error);
      throw error;
    }
  }
}
