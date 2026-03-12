import { Controller, Post, Get, Param, Body, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AIReviewOrchestratorService } from './ai-review-orchestrator.service';

@Controller('ai-review')
export class AIReviewController {
  private readonly logger = new Logger(AIReviewController.name);

  constructor(
    private readonly aiReviewOrchestratorService: AIReviewOrchestratorService,
  ) {}

  // HTTP endpoint for manual triggering (for testing)
  @Post('process/:applicationId')
  async processApplication(@Param('applicationId') applicationId: string) {
    this.logger.log(`Received request to process application ${applicationId}`);
    await this.aiReviewOrchestratorService.processApplicationReview(applicationId);
    return { message: 'Application review started', applicationId };
  }

  // Microservice pattern for backend communication
  @MessagePattern('process_application_review')
  async handleApplicationSubmission(@Payload() data: { applicationId: string }) {
    this.logger.log(`Received microservice request to process application ${data.applicationId}`);
    await this.aiReviewOrchestratorService.processApplicationReview(data.applicationId);
    return { message: 'Application review completed', applicationId: data.applicationId };
  }

  @MessagePattern('get_review_status')
  async handleGetReviewStatus(@Payload() data: { applicationId: string }) {
    this.logger.log(`Received microservice request to get review status for ${data.applicationId}`);
    return await this.aiReviewOrchestratorService.getReviewStatus(data.applicationId);
  }

  @MessagePattern('retry_review')
  async handleRetryReview(@Payload() data: { applicationId: string; reviewType: string }) {
    this.logger.log(`Received microservice request to retry ${data.reviewType} review for ${data.applicationId}`);
    await this.aiReviewOrchestratorService.retryFailedReview(data.applicationId, data.reviewType);
    return { message: 'Review retry completed', applicationId: data.applicationId, reviewType: data.reviewType };
  }

  @MessagePattern('get_application_feedback')
  async handleGetApplicationFeedback(@Payload() data: { applicationId: string }) {
    this.logger.log(`Received microservice request to get feedback for ${data.applicationId}`);
    return await this.aiReviewOrchestratorService.getFeedbackForFrontend(data.applicationId);
  }

  @Get('status/:applicationId')
  async getReviewStatus(@Param('applicationId') applicationId: string) {
    return await this.aiReviewOrchestratorService.getReviewStatus(applicationId);
  }

  @Get('report/:applicationId')
  async getDetailedReport(@Param('applicationId') applicationId: string) {
    return await this.aiReviewOrchestratorService.getDetailedReviewReport(applicationId);
  }

  @Get('feedback/:applicationId')
  async getFeedbackForFrontend(@Param('applicationId') applicationId: string) {
    return await this.aiReviewOrchestratorService.getFeedbackForFrontend(applicationId);
  }

  @Post('retry/:applicationId/:reviewType')
  async retryReview(
    @Param('applicationId') applicationId: string,
    @Param('reviewType') reviewType: string,
  ) {
    await this.aiReviewOrchestratorService.retryFailedReview(applicationId, reviewType);
    return { message: 'Review retry initiated', applicationId, reviewType };
  }

  // Health check endpoint
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'AI Review Service',
      timestamp: new Date().toISOString(),
    };
  }
}
