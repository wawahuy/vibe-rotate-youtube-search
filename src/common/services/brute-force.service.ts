import { Injectable, ForbiddenException } from '@nestjs/common';

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 60 * 1_000; // 1 minute

interface AttemptRecord {
  count: number;
  blockedUntil: Date | null;
}

/**
 * Extract the real client IP from the request, honouring x-forwarded-for
 * when the app runs behind a reverse proxy / Vercel.
 */
export function getClientIp(req: any): string {
  const fwd = req.headers?.['x-forwarded-for'];
  if (fwd) return (fwd as string).split(',')[0].trim();
  return req.ip ?? req.socket?.remoteAddress ?? 'unknown';
}

@Injectable()
export class BruteForceService {
  private readonly store = new Map<string, AttemptRecord>();

  /**
   * Throw 403 if the IP has exceeded MAX_ATTEMPTS failed auth attempts
   * and the block window has not expired yet.
   */
  check(ip: string): void {
    const entry = this.store.get(ip);
    if (!entry?.blockedUntil) return;

    if (entry.blockedUntil > new Date()) {
      throw new ForbiddenException(
        'Too many failed auth attempts. Try again in 1 minute.',
      );
    }

    // Block window expired — clean up and allow
    this.store.delete(ip);
  }

  /**
   * Record a failed auth attempt. Blocks the IP after MAX_ATTEMPTS failures.
   */
  fail(ip: string): void {
    const entry = this.store.get(ip) ?? { count: 0, blockedUntil: null };
    entry.count += 1;
    if (entry.count >= MAX_ATTEMPTS) {
      entry.blockedUntil = new Date(Date.now() + BLOCK_DURATION_MS);
    }
    this.store.set(ip, entry);
  }

  /** Reset the counter after a successful auth. */
  success(ip: string): void {
    this.store.delete(ip);
  }
}
