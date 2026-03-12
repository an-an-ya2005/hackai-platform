import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  // Create HTTP application
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  
  // Create microservice for message-based communication
  const microservice = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: 3003,
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3002);
  
  console.log('AI Service is running on port', process.env.PORT ?? 3002);
  console.log('AI Microservice is running on port 3003');
}
bootstrap();
