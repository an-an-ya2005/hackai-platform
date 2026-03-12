import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { AIServiceClient } from './ai-service-client.service';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [DatabaseModule, NotificationsModule, WebSocketModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, AIServiceClient],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
