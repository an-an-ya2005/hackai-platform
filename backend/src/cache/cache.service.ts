import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

interface CacheManager {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  reset(): Promise<void>;
}

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: CacheManager) {}

  // User session cache
  async getUserSession(userId: string): Promise<any> {
    return await this.cacheManager.get(`user:${userId}`);
  }

  async setUserSession(userId: string, userData: any, ttl: number = 3600): Promise<void> {
    await this.cacheManager.set(`user:${userId}`, userData, ttl * 1000); // Convert to milliseconds
  }

  async deleteUserSession(userId: string): Promise<void> {
    await this.cacheManager.del(`user:${userId}`);
  }

  // Application cache for frequently accessed data
  async getApplications(userId: string): Promise<any[]> {
    const cached = await this.cacheManager.get<any[]>(`applications:${userId}`);
    return cached || [];
  }

  async setApplications(userId: string, applications: any[], ttl: number = 300): Promise<void> {
    await this.cacheManager.set(`applications:${userId}`, applications, ttl * 1000);
  }

  async invalidateApplications(userId: string): Promise<void> {
    await this.cacheManager.del(`applications:${userId}`);
  }

  // Rate limiting cache
  async getRateLimit(identifier: string): Promise<number> {
    const count = await this.cacheManager.get(`rate:${identifier}`);
    return count ? Number(count) : 0;
  }

  async incrementRateLimit(identifier: string, ttl: number = 60): Promise<number> {
    const key = `rate:${identifier}`;
    const current = await this.getRateLimit(identifier);
    const newCount = current + 1;
    await this.cacheManager.set(key, newCount, ttl * 1000);
    return newCount;
  }

  // Generic cache operations
  async get<T>(key: string): Promise<T | undefined> {
    return await this.cacheManager.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const ttlMs = ttl ? ttl * 1000 : undefined;
    await this.cacheManager.set(key, value, ttlMs);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async reset(): Promise<void> {
    await this.cacheManager.reset();
  }
}
