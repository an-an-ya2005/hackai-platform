import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Controller('health')
export class HealthController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get()
  async health() {
    const startTime = Date.now();
    
    try {
      // Check database connectivity
      const dbHealthy = await this.databaseService.healthCheck();
      
      // Check response time
      const responseTime = Date.now() - startTime;
      
      // Memory usage
      const memoryUsage = process.memoryUsage();
      
      // Uptime
      const uptime = process.uptime();
      
      return {
        status: dbHealthy ? 'ok' : 'error',
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        database: dbHealthy ? 'connected' : 'disconnected',
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
          external: Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100,
        },
        uptime: Math.floor(uptime),
        version: process.env.npm_package_version || '1.0.0',
        nodeVersion: process.version,
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  @Get('ready')
  async readiness() {
    try {
      const dbHealthy = await this.databaseService.healthCheck();
      
      if (dbHealthy) {
        return { status: 'ready' };
      } else {
        throw new Error('Database not ready');
      }
    } catch (error) {
      return {
        status: 'not ready',
        error: error.message,
      };
    }
  }

  @Get('live')
  async liveness() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }
}
