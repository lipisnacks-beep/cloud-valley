import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.ts';
import { findAdminById, findCustomerById } from '../services/dataStore.ts';

export const AUTH_COOKIE_NAME = 'cv_admin_token';
export const CUSTOMER_COOKIE_NAME = 'cv_customer_token';

export interface AuthenticatedRequest extends Request {
  admin?: {
    id: string;
    email: string;
    name: string;
    role: 'admin';
  };
}

export interface CustomerAuthenticatedRequest extends Request {
  customer?: {
    id: string;
    email: string;
    name: string;
    phone: string;
    role: 'customer';
  };
}

export function signAdminToken(payload: { id: string; email: string; name: string; role: 'admin' }) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function signCustomerToken(payload: {
  id: string;
  email: string;
  name: string;
  role: 'customer';
}) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

function isHttpsRequest(req: Request): boolean {
  const proto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  return req.secure || proto === 'https' || env.NODE_ENV === 'production';
}

export function setAuthCookie(req: Request, res: Response, token: string): void {
  const isHttps = isHttpsRequest(req);
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearAuthCookie(req: Request, res: Response): void {
  const isHttps = isHttpsRequest(req);
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
    path: '/',
  });
}

export function setCustomerAuthCookie(req: Request, res: Response, token: string): void {
  const isHttps = isHttpsRequest(req);
  res.cookie(CUSTOMER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearCustomerAuthCookie(req: Request, res: Response): void {
  const isHttps = isHttpsRequest(req);
  res.clearCookie(CUSTOMER_COOKIE_NAME, {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
    path: '/',
  });
}

export async function requireAdminAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const token = bearerToken || cookieToken;

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in as administrator.',
      });
      return;
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: string;
      email: string;
      name: string;
      role: string;
    };

    if (decoded.role !== 'admin') {
      res.status(401).json({
        success: false,
        message: 'Administrator privileges required.',
      });
      return;
    }

    const adminRecord = await findAdminById(decoded.id);
    if (!adminRecord || adminRecord.isActive === false) {
      clearAuthCookie(req, res);
      res.status(401).json({
        success: false,
        message: 'Admin account is inactive or unavailable.',
      });
      return;
    }

    req.admin = {
      id: adminRecord._id,
      email: adminRecord.email,
      name: adminRecord.name,
      role: 'admin',
    };
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: 'Session expired or invalid. Please sign in again.',
    });
  }
}

export async function requireCustomerAuth(
  req: CustomerAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cookieToken = req.cookies?.[CUSTOMER_COOKIE_NAME];
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const token = bearerToken || cookieToken;

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Please sign in to your guest account to continue.',
      });
      return;
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: string;
      email: string;
      name: string;
      role: string;
    };

    if (decoded.role !== 'customer') {
      res.status(401).json({
        success: false,
        message: 'Customer guest account sign-in required.',
      });
      return;
    }

    const customerRecord = await findCustomerById(decoded.id);
    if (!customerRecord || customerRecord.isActive === false) {
      clearCustomerAuthCookie(req, res);
      res.status(401).json({
        success: false,
        message: 'Guest account is inactive or unavailable.',
      });
      return;
    }

    req.customer = {
      id: customerRecord._id,
      email: customerRecord.email,
      name: customerRecord.name,
      phone: customerRecord.phone,
      role: 'customer',
    };
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: 'Your guest session expired. Please sign in again.',
    });
  }
}

export function sanitizeObject(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  if (obj && typeof obj === 'object') {
    const clean: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (key.startsWith('$') || key.includes('.')) {
        continue;
      }
      clean[key] = sanitizeObject(value);
    }
    return clean;
  }
  return obj;
}

export function mongoSanitizeMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
}

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
});

export const publicSubmissionRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests submitted from this IP. Please wait a few minutes.',
  },
});
