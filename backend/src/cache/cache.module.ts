import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service.js';

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        ttl: 300 * 1000, // 5 minutes in milliseconds
        max: 10000, // Maximum number of items in cache
        // For now, use memory store - Redis can be added later if needed
        // store: 'memory',
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
  ],
  providers: [CacheService],
  exports: [CacheService, CacheModule],
})
export class CacheCustomModule {}
