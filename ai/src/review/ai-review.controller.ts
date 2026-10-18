import { Controller, Post, Get, Param, Logger, UseGuards } from '@nestjs/common';
import { AIReviewOrchestratorService } from './ai-review-orchestrator.service';
import { AIServiceKeyGuard } from '../common/guards/ai-service-key.guard';

@Controller('ai-review')
export class AIReviewController {
  private readonly logger = new Logger(AIReviewController.name);

  constructor(
    private readonly aiReviewOrchestratorService: AIReviewOrchestratorService,
  ) {}

  @Post('process/:applicationId')
  @UseGuards(AIServiceKeyGuard)
  async processApplication(@Param('applicationId') applicationId: string) {
    this.logger.log(`Received request to process application ${applicationId}`);
    void this.aiReviewOrchestratorService
      .processApplicationReview(applicationId)
      .catch((error) => {
        this.logger.error(
          `Failed to process application ${applicationId}`,
          error instanceof Error ? error.stack : String(error),
        );
      });
    return { message: 'Application review started', applicationId };
  }

  @Get('status/:applicationId')
  @UseGuards(AIServiceKeyGuard)
  async getReviewStatus(@Param('applicationId') applicationId: string) {
    return await this.aiReviewOrchestratorService.getReviewStatus(applicationId);
  }

  @Get('report/:applicationId')
  @UseGuards(AIServiceKeyGuard)
  async getDetailedReport(@Param('applicationId') applicationId: string) {
    return await this.aiReviewOrchestratorService.getDetailedReviewReport(applicationId);
  }

  @Get('feedback/:applicationId')
  @UseGuards(AIServiceKeyGuard)
  async getFeedbackForFrontend(@Param('applicationId') applicationId: string) {
    return await this.aiReviewOrchestratorService.getFeedbackForFrontend(applicationId);
  }

  @Post('retry/:applicationId/:reviewType')
  @UseGuards(AIServiceKeyGuard)
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
