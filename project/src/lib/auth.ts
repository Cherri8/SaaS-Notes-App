import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { queries } from './database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  role: 'admin' | 'member';
  tenant_id: number;
  tenant_slug: string;
  tenant_plan: 'free' | 'pro';
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: 'admin' | 'member';
  tenantId: number;
  tenantSlug: string;
  tenantPlan: 'free' | 'pro';
}

export function generateToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenant_id,
    tenantSlug: user.tenant_slug,
    tenantPlan: user.tenant_plan,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const user = queries.getUserByEmail(email) as User | undefined;
  
  if (!user) {
    return null;
  }

  const isValidPassword = bcrypt.compareSync(password, user.password_hash);
  if (!isValidPassword) {
    return null;
  }

  return user;
}

export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

export function requireAuth(token: string | null): JWTPayload {
  if (!token) {
    throw new Error('Authentication required');
  }

  const payload = verifyToken(token);
  if (!payload) {
    throw new Error('Invalid or expired token');
  }

  return payload;
}

export function requireRole(user: JWTPayload, requiredRole: 'admin' | 'member'): void {
  if (requiredRole === 'admin' && user.role !== 'admin') {
    throw new Error('Admin access required');
  }
}
