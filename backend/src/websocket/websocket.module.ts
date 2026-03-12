import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ApplicationStatusGateway } from './application-status.gateway';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
      signOptions: { expiresIn: '7d' },
    }),
    NotificationsModule,
  ],
  providers: [ApplicationStatusGateway],
  exports: [ApplicationStatusGateway],
})
export class WebSocketModule {}
