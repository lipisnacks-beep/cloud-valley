import crypto from 'node:crypto';
import dotenv from 'dotenv';

dotenv.config();

const runtimeJwtFallback = crypto.randomBytes(32).toString('hex');
const runtimeCookieFallback = crypto.randomBytes(32).toString('hex');

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 3000),
  CLIENT_URL: process.env.CLIENT_URL || process.env.APP_URL || 'http://localhost:3000',
  PUBLIC_SITE_URL: process.env.PUBLIC_SITE_URL || process.env.APP_URL || 'http://localhost:3000',
  MONGODB_URI: process.env.MONGODB_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || runtimeJwtFallback,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  COOKIE_SECRET: process.env.COOKIE_SECRET || runtimeCookieFallback,
  ADMIN_NAME: process.env.ADMIN_NAME || 'Resort Administrator',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@cloudvalleysamalbong.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || '',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: Number(process.env.SMTP_PORT || 587),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || '',
  SMTP_FROM: process.env.SMTP_FROM || 'CLOUD VALLEY <reservations@cloudvalleysamalbong.com>',
  RESORT_NAME: process.env.RESORT_NAME || 'CLOUD VALLEY',
  RESORT_TIMEZONE: process.env.RESORT_TIMEZONE || 'Asia/Kolkata',
  RESORT_CURRENCY: process.env.RESORT_CURRENCY || 'INR',
};

export const isCloudinaryConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
);

export const isSmtpConfigured = Boolean(
  env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD
);
