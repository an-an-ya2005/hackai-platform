import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DatabaseModule } from '../database/database.module';
import { AIReviewController } from './ai-review.controller';
import { AIReviewOrchestratorService } from './ai-review-orchestrator.service';
import { ExternalIdeaReviewService } from './external-idea-review.service';
import { InternalIdeaReviewService } from './internal-idea-review.service';
import { CategorizationService } from './categorization.service';
import { ImplementationReviewService } from './implementation-review.service';
import { CostReviewService } from './cost-review.service';
import { CustomerImpactReviewService } from './customer-impact-review.service';
import { WebSocketClient } from '../websocket/websocket-client.service';
import { MCPClientService } from '../mcp/mcp-client.service';

@Module({
  imports: [
    DatabaseModule,
    HttpModule,
  ],
  controllers: [AIReviewController],
  providers: [
    AIReviewOrchestratorService,
    ExternalIdeaReviewService,
    InternalIdeaReviewService,
    CategorizationService,
    ImplementationReviewService,
    CostReviewService,
    CustomerImpactReviewService,
    WebSocketClient,
    MCPClientService,
  ],
  exports: [AIReviewOrchestratorService],
})
export class AIReviewModule {}
