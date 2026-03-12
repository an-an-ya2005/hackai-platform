import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private store: RateLimitStore = {};
  private readonly limit = 1000; // 1000 requests per window
  private readonly windowMs = 60 * 1000; // 1 minute window

  use(req: Request, res: Response, next: NextFunction) {
    const identifier = this.getIdentifier(req);
    const now = Date.now();
    
    // Clean up expired entries
    this.cleanup(now);
    
    // Get or create entry for this identifier
    if (!this.store[identifier]) {
      this.store[identifier] = {
        count: 0,
        resetTime: now + this.windowMs,
      };
    }
    
    const entry = this.store[identifier];
    
    // Reset if window has passed
    if (now > entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + this.windowMs;
    }
    
    // Check if limit exceeded
    if (entry.count >= this.limit) {
      res.set({
        'X-RateLimit-Limit': this.limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': Math.ceil(entry.resetTime / 1000).toString(),
      });
      
      throw new HttpException(
        {
          message: 'Too many requests',
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    
    // Increment counter
    entry.count++;
    
    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': this.limit.toString(),
      'X-RateLimit-Remaining': (this.limit - entry.count).toString(),
      'X-RateLimit-Reset': Math.ceil(entry.resetTime / 1000).toString(),
    });
    
    next();
  }
  
  private getIdentifier(req: Request): string {
    // Use IP address and user ID if available for more granular rate limiting
    const userId = req.user?.id || 'anonymous';
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return `${ip}:${userId}`;
  }
  
  private cleanup(now: number) {
    // Remove expired entries to prevent memory leaks
    Object.keys(this.store).forEach(key => {
      if (now > this.store[key].resetTime + this.windowMs) {
        delete this.store[key];
      }
    });
  }
}
