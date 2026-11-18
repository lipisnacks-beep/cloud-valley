import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed. Please review your input.',
      errors: err.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  const message = err instanceof Error ? err.message : 'An unexpected server error occurred';
  const status = (err as { status?: number })?.status || 500;
  if (status >= 500) {
    console.error('[ServerError]', err);
  }
  res.status(status).json({
    success: false,
    message,
    errors: [],
  });
}
