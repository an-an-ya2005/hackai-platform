import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WebSocketClient {
  private readonly logger = new Logger(WebSocketClient.name);

  async onModuleInit(): Promise<void> {
    this.logger.log('WebSocket client disabled; skipping startup connection');
  }

  async ensureConnection(): Promise<void> {
    this.logger.debug('WebSocket client is disabled; no connection will be made');
  }

  isConnected(): boolean {
    return false;
  }

  async sendApplicationStatusUpdate(applicationId: string, status: string, details?: any) {
    this.logger.warn(`WebSocket disabled; skipping status update for application ${applicationId}`);
  }

  async sendApplicationRejection(applicationId: string, rejectionDetails: any) {
    this.logger.warn(`WebSocket disabled; skipping rejection update for application ${applicationId}`);
  }

  async sendAIReviewProgress(applicationId: string, stage: string, result: string, details?: any) {
    this.logger.warn(`WebSocket disabled; skipping review progress update for application ${applicationId}`);
  }
}
