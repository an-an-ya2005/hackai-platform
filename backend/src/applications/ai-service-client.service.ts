import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

@Injectable()
export class AIServiceClient implements OnModuleInit, OnModuleDestroy {
  private client: ClientProxy;
  private readonly logger = new Logger(AIServiceClient.name);

  onModuleInit() {
    this.client = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host: 'localhost',
        port: 3003,
      },
    });
  }

  async onModuleDestroy() {
    await this.client?.close();
  }

  async processApplicationReview(applicationId: string): Promise<any> {
    try {
      this.logger.log(`Sending application ${applicationId} to AI service for review`);
      
      const result = await firstValueFrom(
        this.client.send('process_application_review', { applicationId }).pipe(
          timeout(300000) // 5 minutes timeout
        )
      );
      
      this.logger.log(`AI service response for application ${applicationId}:`, result);
      return result;
    } catch (error) {
      this.logger.error(`Error communicating with AI service for application ${applicationId}:`, error);
      throw error;
    }
  }

  async getReviewStatus(applicationId: string): Promise<any> {
    try {
      const result = await firstValueFrom(
        this.client.send('get_review_status', { applicationId }).pipe(
          timeout(30000) // 30 seconds timeout
        )
      );
      
      return result;
    } catch (error) {
      this.logger.error(`Error getting review status from AI service for application ${applicationId}:`, error);
      throw error;
    }
  }

  async retryReview(applicationId: string, reviewType: string): Promise<any> {
    try {
      const result = await firstValueFrom(
        this.client.send('retry_review', { applicationId, reviewType }).pipe(
          timeout(60000) // 1 minute timeout
        )
      );
      
      return result;
    } catch (error) {
      this.logger.error(`Error retrying review for application ${applicationId}:`, error);
      throw error;
    }
  }

  async getApplicationFeedback(applicationId: string): Promise<any> {
    try {
      this.logger.log(`Getting feedback from AI service for application ${applicationId}`);
      
      const result = await firstValueFrom(
        this.client.send('get_application_feedback', { applicationId }).pipe(
          timeout(30000) // 30 seconds timeout
        )
      );
      
      return result;
    } catch (error) {
      this.logger.error(`Error getting feedback from AI service for application ${applicationId}:`, error);
      throw error;
    }
  }
}
