import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NotificationsService } from '../notifications/notifications.service';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000'], // Frontend URL
    credentials: true,
  },
})
export class ApplicationStatusGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ApplicationStatusGateway.name);
  private userSockets = new Map<string, string>(); // userId -> socketId

  constructor(
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Check if this is an AI service connection
      const isAIService = client.handshake.auth.service === 'ai-service' || 
                         client.handshake.query.source === 'ai-service';
      
      if (isAIService) {
        this.logger.log('AI service connected via WebSocket');
        client.data.isAIService = true;
        client.data.userId = 'ai-service';
        
        // Join AI service to global room for broadcasting
        client.join('ai-service');
        return;
      }

      // Regular user authentication
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        this.logger.warn('WebSocket connection rejected: No token provided');
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      // Store user's socket connection
      this.userSockets.set(userId, client.id);
      client.data.userId = userId;
      client.data.isAIService = false;

      this.logger.log(`User ${userId} connected via WebSocket`);

      // Join user to their personal room for private updates
      client.join(`user:${userId}`);

    } catch (error) {
      this.logger.error('WebSocket authentication failed:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.isAIService) {
      this.logger.log('AI service disconnected from WebSocket');
    } else if (client.data.userId) {
      this.userSockets.delete(client.data.userId);
      this.logger.log(`User ${client.data.userId} disconnected from WebSocket`);
    }
  }

  @SubscribeMessage('join-application-updates')
  handleJoinApplicationUpdates(
    @MessageBody() data: { applicationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { applicationId } = data;
    const userId = client.data.userId;
    
    this.logger.log(`User ${userId} joining updates for application ${applicationId}`);
    client.join(`application:${applicationId}`);
    
    return { status: 'joined', applicationId };
  }

  @SubscribeMessage('leave-application-updates')
  handleLeaveApplicationUpdates(
    @MessageBody() data: { applicationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { applicationId } = data;
    const userId = client.data.userId;
    
    this.logger.log(`User ${userId} leaving updates for application ${applicationId}`);
    client.leave(`application:${applicationId}`);
    
    return { status: 'left', applicationId };
  }

  @SubscribeMessage('ai-service-status-update')
  handleAIServiceStatusUpdate(@MessageBody() data: any) {
    this.logger.log(`Received AI service status update:`, data);
    
    // Forward to application-specific room and user room if userId is provided
    this.server.to(`application:${data.applicationId}`).emit('application-status-updated', data);
    
    if (data.userId) {
      this.server.to(`user:${data.userId}`).emit('application-status-updated', data);
    }
  }

  @SubscribeMessage('ai-service-rejection')
  async handleAIServiceRejection(@MessageBody() data: any) {
    this.logger.log(`Received AI service rejection:`, data);
    
    // Create notification in database
    if (data.userId) {
      try {
        const notification = await this.notificationsService.create({
          userId: data.userId,
          type: 'APPLICATION_STATUS_CHANGE',
          title: 'Application Rejected by AI Review',
          message: `Your application "${data.feedback || 'has been rejected'}" by our AI review system. ${data.details?.aiAnalysis || 'Please review the feedback and consider resubmitting with improvements.'}`,
          metadata: {
            applicationId: data.applicationId,
            rejectionStage: data.rejectionStage,
            primaryReason: data.primaryReason,
            score: data.score,
            details: data.details,
          },
        });

        // Send notification via WebSocket
        this.server.to(`user:${data.userId}`).emit('new-notification', {
          notification,
          timestamp: new Date().toISOString(),
        });

        this.logger.log(`Created notification for user ${data.userId} - application ${data.applicationId} rejected`);
      } catch (error) {
        this.logger.error('Failed to create notification for AI rejection:', error);
      }
    }
    
    // Send rejection details to user
    if (data.userId) {
      this.server.to(`user:${data.userId}`).emit('application-rejected', data);
    }
    
    // Also send to application room
    this.server.to(`application:${data.applicationId}`).emit('application-rejected', data);
  }

  @SubscribeMessage('ai-service-review-progress')
  handleAIServiceReviewProgress(@MessageBody() data: any) {
    this.logger.log(`Received AI service review progress:`, data);
    
    // Forward to application room
    this.server.to(`application:${data.applicationId}`).emit('ai-review-progress', data);
    
    // Also send to user if userId is provided
    if (data.userId) {
      this.server.to(`user:${data.userId}`).emit('ai-review-progress', data);
    }
  }

  /**
   * Send application status update to specific user
   */
  sendApplicationStatusUpdate(userId: string, applicationId: string, status: string, details?: any) {
    this.logger.log(`Sending status update to user ${userId}: ${applicationId} -> ${status}`);
    
    const updateData = {
      applicationId,
      status,
      timestamp: new Date().toISOString(),
      ...details,
    };

    // Send to user's personal room
    this.server.to(`user:${userId}`).emit('application-status-updated', updateData);
    
    // Also send to application-specific room (for admins or other interested parties)
    this.server.to(`application:${applicationId}`).emit('application-status-updated', updateData);
  }

  /**
   * Send application rejection details to user
   */
  sendApplicationRejection(userId: string, applicationId: string, rejectionDetails: any) {
    this.logger.log(`Sending rejection details to user ${userId} for application ${applicationId}`);
    
    const rejectionData = {
      applicationId,
      status: 'REJECTED',
      isRejected: true,
      timestamp: new Date().toISOString(),
      ...rejectionDetails,
    };

    // Send to user's personal room
    this.server.to(`user:${userId}`).emit('application-rejected', rejectionData);
    
    // Also send general status update
    this.sendApplicationStatusUpdate(userId, applicationId, 'REJECTED', rejectionDetails);
  }

  /**
   * Send AI review progress updates
   */
  sendAIReviewProgress(userId: string, applicationId: string, stage: string, result: string, details?: any) {
    this.logger.log(`Sending AI review progress to user ${userId}: ${applicationId} - ${stage} -> ${result}`);
    
    const progressData = {
      applicationId,
      reviewStage: stage,
      result,
      timestamp: new Date().toISOString(),
      ...details,
    };

    this.server.to(`user:${userId}`).emit('ai-review-progress', progressData);
  }

  /**
   * Broadcast to all connected users (for admin notifications)
   */
  broadcastToAll(event: string, data: any) {
    this.logger.log(`Broadcasting ${event} to all connected users`);
    this.server.emit(event, data);
  }

  /**
   * Send notification to all admins
   */
  sendToAdmins(event: string, data: any) {
    this.logger.log(`Sending ${event} to admin users`);
    this.server.to('role:admin').emit(event, data);
  }
}
