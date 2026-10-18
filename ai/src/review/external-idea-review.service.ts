import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { DatabaseService } from '../database/database.service';
import { WebSocketClient } from '../websocket/websocket-client.service';
import { MCPClientService, MCPAnalysisResult } from '../mcp/mcp-client.service';
import { detectClearProblemSolutionMismatch } from './problem-solution-fit';
import { detectClearlyShallowStudyIdea } from './idea-merit';

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

      const meritAssessment = detectClearlyShallowStudyIdea(
        application.problemStatement,
        `${application.description} ${application.solution}`,
      );
      if (meritAssessment.isClearlyShallow) {
        const feedback = `This idea was rejected because its problem statement is too broad to show a meaningful hackathon need, and the proposed solution is limited to common study-planning features without a specific outcome. ${meritAssessment.reason} To qualify, describe a concrete study challenge and explain how your solution measurably helps address it.`;
        const metadata = {
          rejectionReason: 'CLEARLY_LOW_VALUE',
          ideaMeritDecision: 'CLEARLY_LOW_VALUE',
          ideaMeritConfidence: meritAssessment.confidence,
          ideaMeritReason: meritAssessment.reason,
          genericFeatureCount: meritAssessment.genericFeatureCount,
          analysisMethod: 'CLEAR_SHALLOW_STUDY_IDEA_CHECK',
        };

        await this.databaseService.aIReview.update({
          where: { id: aiReview.id },
          data: {
            result: 'REJECTED',
            feedback,
            metadata,
            processedAt: new Date(),
            score: meritAssessment.confidence,
          },
        });
        await this.databaseService.application.update({
          where: { id: applicationId },
          data: { status: 'REJECTED', rejectionReason: feedback },
        });
        await this.webSocketClient.sendApplicationRejection(applicationId, {
          userId: application.userId,
          rejectionStage: 'EXTERNAL_IDEA',
          primaryReason: 'The problem is too broad and the solution has no specific outcome',
          feedback,
          score: meritAssessment.confidence,
          details: metadata,
        });

        this.logger.log(`Application ${applicationId} rejected for a clearly shallow study idea`);
        return;
      }

      const fitAssessment = detectClearProblemSolutionMismatch(
        application.problemStatement,
        application.solution,
      );
      if (fitAssessment.isMismatch && fitAssessment.confidence >= 0.9) {
        const feedback = `The stated problem focuses on ${fitAssessment.problemDomains.join(', ')}, but the proposed solution focuses on ${fitAssessment.solutionDomains.join(', ')}. The solution does not address the problem as written. Please choose an idea whose solution directly addresses its problem, or revise these sections so they match.`;
        const metadata = {
          rejectionReason: 'PROBLEM_SOLUTION_MISMATCH',
          problemSolutionFit: 0,
          mismatchConfidence: fitAssessment.confidence,
          problemDomains: fitAssessment.problemDomains,
          solutionDomains: fitAssessment.solutionDomains,
          analysisMethod: 'DOMAIN_MISMATCH_CHECK',
        };

        await this.databaseService.aIReview.update({
          where: { id: aiReview.id },
          data: {
            result: 'REJECTED',
            feedback,
            metadata,
            processedAt: new Date(),
            score: fitAssessment.confidence,
          },
        });
        await this.databaseService.application.update({
          where: { id: applicationId },
          data: { status: 'REJECTED', rejectionReason: feedback },
        });
        await this.webSocketClient.sendApplicationRejection(applicationId, {
          userId: application.userId,
          rejectionStage: 'EXTERNAL_IDEA',
          primaryReason: 'The proposed solution does not address the stated problem',
          feedback,
          score: fitAssessment.confidence,
          details: metadata,
        });

        this.logger.log(`Application ${applicationId} rejected for a clear problem-solution mismatch`);
        return;
      }

      // Use MCP + Gemini for intelligent analysis
      const analysisResult = await this.analyzeWithGeminiAI(application);
      
      const isClearDuplicate = analysisResult.isSimilar
        && analysisResult.recommendation === 'REJECT'
        && analysisResult.rejectionType === 'CLEAR_DUPLICATE'
        && analysisResult.companyMatchVerified === true
        && typeof analysisResult.mostSimilarCompany?.name === 'string'
        && typeof analysisResult.problemSimilarity === 'number'
        && analysisResult.problemSimilarity >= 0
        && analysisResult.problemSimilarity >= 0.85
        && analysisResult.problemSimilarity <= 1
        && typeof analysisResult.solutionSimilarity === 'number'
        && analysisResult.solutionSimilarity >= 0
        && analysisResult.solutionSimilarity >= 0.85
        && analysisResult.solutionSimilarity <= 1;
      const isClearMismatch = analysisResult.recommendation === 'REJECT'
        && analysisResult.rejectionType === 'PROBLEM_SOLUTION_MISMATCH'
        && typeof analysisResult.problemSolutionFit === 'number'
        && analysisResult.problemSolutionFit >= 0
        && analysisResult.problemSolutionFit <= 0.15
        && typeof analysisResult.mismatchConfidence === 'number'
        && analysisResult.mismatchConfidence <= 1
        && analysisResult.mismatchConfidence >= 0.9;
      const isClearlyLowValue = analysisResult.ideaMeritDecision === 'CLEARLY_LOW_VALUE'
        && typeof analysisResult.ideaMeritConfidence === 'number'
        && analysisResult.ideaMeritConfidence >= 0.9
        && analysisResult.ideaMeritConfidence <= 1;
      const shouldReject = isClearDuplicate || isClearMismatch || isClearlyLowValue;
      
      let feedback = '';
      let metadata = {
        geminiAnalysis: JSON.parse(JSON.stringify(analysisResult)),
        analysisMethod: 'MCP_GEMINI_AI',
      };

      if (shouldReject) {
        const similarityScore = analysisResult.similarityScore;
        const reviewScore = isClearlyLowValue && !isClearDuplicate && !isClearMismatch
          ? analysisResult.ideaMeritConfidence
          : similarityScore;
        
        // Use Gemini's feedback directly
        feedback = isClearDuplicate
          ? `${analysisResult.feedback} This idea closely matches an existing company. Please choose a different idea.`
          : isClearlyLowValue
            ? `This idea was rejected because it does not present a sufficiently meaningful hackathon problem and solution. ${analysisResult.ideaMeritReason || analysisResult.feedback} Add a specific, consequential problem and a solution that delivers a concrete outcome. Simple solutions can be strong when they solve a genuine problem.`
            : analysisResult.feedback;
        
        // Enhanced metadata with Gemini insights
        const enhancedMetadata = {
          geminiAnalysis: JSON.parse(JSON.stringify(analysisResult)),
          rejectionReason: isClearDuplicate
            ? 'CLEAR_DUPLICATE'
            : isClearMismatch
              ? 'PROBLEM_SOLUTION_MISMATCH'
              : 'CLEARLY_LOW_VALUE',
          similarityScore,
          ideaMeritDecision: analysisResult.ideaMeritDecision || null,
          ideaMeritConfidence: analysisResult.ideaMeritConfidence ?? null,
          ideaMeritReason: analysisResult.ideaMeritReason || null,
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
            score: reviewScore,
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
          primaryReason: isClearDuplicate
            ? 'Clear duplicate found in Y Combinator analysis'
            : isClearMismatch
              ? 'Problem and proposed solution do not match'
              : 'Idea does not meet the minimum substantive-value threshold',
          feedback,
          score: reviewScore,
          details: {
            similarityScore,
            mostSimilarCompany: analysisResult.mostSimilarCompany,
            suggestions: analysisResult.suggestions || [],
            rejectionReason: isClearDuplicate ? 'CLEAR_DUPLICATE' : 'PROBLEM_SOLUTION_MISMATCH',
            aiAnalysis: analysisResult.analysis,
          },
        });
      } else {
        feedback = analysisResult.recommendation === 'REJECT'
          ? `${analysisResult.feedback} This did not meet the strict automatic-rejection criteria; continuing to administrator review.`
          : 'No clear duplicate or problem-solution mismatch met the automatic-rejection criteria. Continuing to internal review; an administrator makes the final decision.';
        
        await this.databaseService.aIReview.update({
          where: { id: aiReview.id },
          data: {
            result: 'APPROVED',
            feedback,
            metadata,
            processedAt: new Date(),
            score: analysisResult.similarityScore,
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
            message: 'No clear duplicate or mismatch was established. Moving to internal review; an administrator makes the final decision...',
            nextStage: 'INTERNAL_IDEA_REVIEW',
            aiConfidence: analysisResult.similarityScore
          }
        );
      }

      this.logger.log(`External idea review completed for application ${applicationId}: ${shouldReject ? 'REJECTED' : 'APPROVED'}`);
    } catch (error) {
      this.logger.error(`Error in external idea review for application ${applicationId}:`, error);
      
      // Update AI review with error
      await this.databaseService.aIReview.updateMany({
        where: { 
          applicationId,
          type: 'EXTERNAL_IDEA',
        },
        data: {
          result: 'PENDING',
          errorMessage: error.message,
          processedAt: new Date(),
        },
      });
    }
  }

  /**
   * Analyze idea similarity using MCP + Gemini AI
   */
  private async analyzeWithGeminiAI(application: {
    title: string;
    description: string;
    problemStatement: string;
    solution: string;
  }): Promise<MCPAnalysisResult> {
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
        title: application.title,
        description: application.description,
        problemStatement: application.problemStatement,
        proposedSolution: application.solution,
        targetMarket: 'Not specified', // Could be extracted from application in future
        businessModel: 'Not specified'
      };

      // Call MCP server with Gemini AI analysis
      const analysisResult = await this.mcpClient.analyzeIdeaSimilarity(
        userApplication,
        ycCompanies
      );
      const matchedCompanyName = typeof analysisResult.mostSimilarCompany?.name === 'string'
        ? analysisResult.mostSimilarCompany.name.trim().toLowerCase()
        : '';
      const companyMatchVerified = Boolean(matchedCompanyName)
        && ycCompanies.some((company) => company.name.trim().toLowerCase() === matchedCompanyName);
      const verifiedAnalysisResult = { ...analysisResult, companyMatchVerified };
      
      this.logger.log(`Gemini analysis completed: ${verifiedAnalysisResult.recommendation} (similarity: ${verifiedAnalysisResult.similarityScore})`);
      
      if (verifiedAnalysisResult.mostSimilarCompany) {
        this.logger.log(`Most similar company: ${verifiedAnalysisResult.mostSimilarCompany.name} - ${verifiedAnalysisResult.mostSimilarCompany.reason}`);
      }

      return verifiedAnalysisResult;

    } catch (error) {
      this.logger.error('Error in Gemini AI analysis:', error);
      
      // Return safe fallback
      return {
        isSimilar: false,
        similarityScore: 0,
        rejectionType: 'NONE',
        ideaMeritDecision: 'REVIEW',
        ideaMeritConfidence: 0,
        ideaMeritReason: 'The analysis failed; administrator review is required.',
        recommendation: 'APPROVE',
        feedback: 'Unable to complete AI analysis due to technical issues. Administrator review is required.',
        error: true,
        message: error.message
      };
    }
  }
}
