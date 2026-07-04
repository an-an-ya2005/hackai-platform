import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Request, Response } from 'express';

async function bootstrap() {
  // Create app with optimized settings for high concurrency
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  
  const configService = app.get(ConfigService);

  // Enable CORS with optimized settings
  const frontendOrigins = [
    ...(configService.get('CORS_ORIGIN') || configService.get('FRONTEND_URL') || '')
      .split(',')
      .map((origin: string) => origin.trim())
      .filter(Boolean),
    'http://localhost:3000',
    'http://localhost:3004',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3004',
  ];

  const isAllowedOrigin = (requestOrigin: string | undefined): boolean => {
    if (!requestOrigin) {
      return true;
    }

    if (frontendOrigins.includes(requestOrigin)) {
      return true;
    }

    return frontendOrigins.some((allowedOrigin) => {
      if (!allowedOrigin.includes('*')) {
        return false;
      }

      const pattern = new RegExp(`^${allowedOrigin.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`);
      return pattern.test(requestOrigin);
    });
  };

  app.enableCors({
    origin: (requestOrigin, callback) => {
      if (isAllowedOrigin(requestOrigin)) {
        return callback(null, true);
      }

      console.warn(`Blocked CORS request from origin: ${requestOrigin}`);
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400, // 24 hours
  });

  // Global validation pipe with optimizations
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: false,
      skipNullProperties: false,
      skipUndefinedProperties: false,
      disableErrorMessages: process.env.NODE_ENV === 'production',
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  // Provide a friendly root route for direct browser access to the backend port
  app.getHttpAdapter().get('/', (_req: Request, res: Response) => {
    const frontendUrl = configService.get('FRONTEND_URL') || 'http://localhost:3000';
    res.redirect(frontendUrl);
  });

  // Swagger/OpenAPI setup (optional)
  const enableDocs = configService.get('ENABLE_API_DOCS') === 'true' || process.env.ENABLE_API_DOCS === 'true';
  if (enableDocs) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('AI Hackathon API')
      .setDescription('REST API for authentication, applications, reviews, and notifications')
      .setVersion('1.0.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = configService.get('PORT') || 3001;
  
  // Start server with keep-alive settings for high concurrency
  const server = await app.listen(port, '0.0.0.0');
  
  // Optimize for high concurrency
  server.keepAliveTimeout = 65000; // 65 seconds
  server.headersTimeout = 66000; // 66 seconds
  
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📊 Health check available at: http://localhost:${port}/api/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();
