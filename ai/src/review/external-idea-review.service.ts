import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { DatabaseService } from '../database/database.service';
import { WebSocketClient } from '../websocket/websocket-client.service';
import { MCPClientService, MCPAnalysisResult } from '../mcp/mcp-client.service';

export interface ExternalSourceResult {
  found: boolean;
  source?: string;
  url?: string;
  similarity?: number;
  details?: string;
}

@Injectable()
export class ExternalIdeaReviewService {
  private readonly logger = new Logger(ExternalIdeaReviewService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly databaseService: DatabaseService,
    private readonly webSocketClient: WebSocketClient,
    private readonly mcpClient: MCPClientService,
  ) {}

  async reviewIdea(applicationId: string): Promise<void> {
    this.logger.log(`Starting external idea review for application ${applicationId}`);

    try {
      // Ensure WebSocket connection is established before starting review
      this.logger.log('Ensuring WebSocket connection before starting review...');
      await this.webSocketClient.ensureConnection();
      
      if (!this.webSocketClient.isConnected()) {
        this.logger.warn('WebSocket connection could not be established, proceeding without real-time updates');
      } else {
        this.logger.log('WebSocket connection confirmed, proceeding with review');
      }

      const application = await this.databaseService.application.findUnique({
        where: { id: applicationId },
        include: { user: true },
      });

      if (!application) {
        throw new Error(`Application ${applicationId} not found`);
      }

      // Send real-time update: Review started
      await this.webSocketClient.sendAIReviewProgress(
        applicationId,
        'EXTERNAL_IDEA',
        'STARTED',
        { 
          message: 'Starting AI-powered similarity analysis...',
          details: `Using Gemini AI to analyze "${application.title}" against Y Combinator portfolio`
        }
      );

      // Create AI review record
      const aiReview = await this.databaseService.aIReview.create({
        data: {
          applicationId,
          type: 'EXTERNAL_IDEA',
          result: 'PENDING',
        },
      });

      // Use MCP + Gemini for intelligent analysis
      const analysisResult = await this.analyzeWithGeminiAI(application.title, application.description);
      
      const foundInExternal = analysisResult.isSimilar;
      
      let feedback = '';
      let metadata = {
        geminiAnalysis: JSON.parse(JSON.stringify(analysisResult)),
        analysisMethod: 'MCP_GEMINI_AI',
      };

      if (foundInExternal) {
        const similarityScore = analysisResult.similarityScore;
        
        // Use Gemini's feedback directly
        feedback = analysisResult.feedback;
        
        // Enhanced metadata with Gemini insights
        const enhancedMetadata = {
          geminiAnalysis: JSON.parse(JSON.stringify(analysisResult)),
          rejectionReason: 'SIMILAR_IDEA_EXISTS_YC',
          similarityScore,
          suggestions: analysisResult.suggestions || [],
          mostSimilarCompany: analysisResult.mostSimilarCompany || null,
          analysisMethod: 'MCP_GEMINI_AI',
          aiRecommendation: analysisResult.recommendation
        };
        
        // Update AI review and application status
        await this.databaseService.aIReview.update({
          where: { id: aiReview.id },
          data: {
            result: 'REJECTED',
            feedback,
            metadata: enhancedMetadata,
            processedAt: new Date(),
            score: similarityScore,
          },
        });

        await this.databaseService.application.update({
          where: { id: applicationId },
          data: {
            status: 'REJECTED',
            rejectionReason: feedback,
          },
        });

        // Send real-time rejection update with Gemini analysis
        await this.webSocketClient.sendApplicationRejection(applicationId, {
          userId: application.userId,
          rejectionStage: 'EXTERNAL_IDEA',
          primaryReason: 'AI Detected Similar Startup in Y Combinator',
          feedback,
          score: similarityScore,
          details: {
            similarityScore,
            mostSimilarCompany: analysisResult.mostSimilarCompany,
            suggestions: analysisResult.suggestions || [],
            rejectionReason: 'SIMILAR_IDEA_EXISTS_YC',
            aiAnalysis: analysisResult.analysis,
          },
        });
      } else {
        feedback = 'Gemini AI analysis found no significant similarity to existing Y Combinator companies. Proceeding to internal review.';
        
        await this.databaseService.aIReview.update({
          where: { id: aiReview.id },
          data: {
            result: 'APPROVED',
            feedback,
            metadata,
            processedAt: new Date(),
            score: 0.9, // High confidence for approved
          },
        });

        // Move to next stage
        await this.databaseService.application.update({
          where: { id: applicationId },
          data: {
            status: 'INTERNAL_IDEA_REVIEW',
          },
        });

        // Send real-time update: Moving to next stage
        await this.webSocketClient.sendAIReviewProgress(
          applicationId,
          'EXTERNAL_IDEA',
          'APPROVED',
          { 
            message: 'Gemini AI found no similar ideas in Y Combinator. Moving to internal review...',
            nextStage: 'INTERNAL_IDEA_REVIEW',
            aiConfidence: analysisResult.similarityScore
          }
        );
      }

      this.logger.log(`External idea review completed for application ${applicationId}: ${foundInExternal ? 'REJECTED' : 'APPROVED'}`);
    } catch (error) {
      this.logger.error(`Error in external idea review for application ${applicationId}:`, error);
      
      // Update AI review with error
      await this.databaseService.aIReview.updateMany({
        where: { 
          applicationId,
          type: 'EXTERNAL_IDEA',
        },
        data: {
          result: 'REJECTED',
          errorMessage: error.message,
          processedAt: new Date(),
        },
      });
    }
  }

  /**
   * Analyze idea similarity using MCP + Gemini AI
   */
  private async analyzeWithGeminiAI(title: string, description: string): Promise<MCPAnalysisResult> {
    try {
      this.logger.log('Starting Gemini AI analysis via MCP...');
      
      // Send real-time update
      await this.webSocketClient.sendAIReviewProgress(
        '', // Will be set by caller if needed
        'EXTERNAL_IDEA',
        'IN_PROGRESS',
        { 
          message: 'Fetching Y Combinator companies...',
          details: 'Preparing data for Gemini AI analysis'
        }
      );

      // Fetch YC companies data via MCP
      const ycCompanies = await this.mcpClient.fetchYCCompanies();
      
      this.logger.log(`Fetched ${ycCompanies.length} YC companies for analysis`);
      
      // Send real-time update
      await this.webSocketClient.sendAIReviewProgress(
        '', // Will be set by caller if needed
        'EXTERNAL_IDEA',
        'IN_PROGRESS',
        { 
          message: 'Analyzing with Gemini AI...',
          details: `Comparing against ${ycCompanies.length} Y Combinator companies`
        }
      );

      // Prepare user application data
      const userApplication = {
        title,
        description,
        targetMarket: 'Not specified', // Could be extracted from application in future
        businessModel: 'Not specified'
      };

      // Call MCP server with Gemini AI analysis
      const analysisResult = await this.mcpClient.analyzeIdeaSimilarity(
        userApplication,
        ycCompanies
      );
      
      this.logger.log(`Gemini analysis completed: ${analysisResult.recommendation} (similarity: ${analysisResult.similarityScore})`);
      
      if (analysisResult.mostSimilarCompany) {
        this.logger.log(`Most similar company: ${analysisResult.mostSimilarCompany.name} - ${analysisResult.mostSimilarCompany.reason}`);
      }

      return analysisResult;

    } catch (error) {
      this.logger.error('Error in Gemini AI analysis:', error);
      
      // Return safe fallback
      return {
        isSimilar: false,
        similarityScore: 0,
        recommendation: 'APPROVE',
        feedback: 'Unable to complete AI analysis due to technical issues. Application approved for manual review.',
        error: true,
        message: error.message
      };
    }
  }
}
