import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class InternalIdeaReviewService {
  private readonly logger = new Logger(InternalIdeaReviewService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async reviewIdea(applicationId: string): Promise<void> {
    this.logger.log(`Starting internal idea review for application ${applicationId}`);

    try {
      const application = await this.databaseService.application.findUnique({
        where: { id: applicationId },
      });

      if (!application) {
        throw new Error(`Application ${applicationId} not found`);
      }

      // Create AI review record
      const aiReview = await this.databaseService.aIReview.create({
        data: {
          applicationId,
          type: 'INTERNAL_IDEA',
          result: 'PENDING',
        },
      });

      // Get all other active applications for comparison
      const otherApplications = await this.databaseService.application.findMany({
        where: {
          id: { not: applicationId },
          isActive: true,
          status: { not: 'DRAFT' },
        },
        select: {
          id: true,
          title: true,
          description: true,
          problemStatement: true,
          solution: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      // Check for similar ideas
      const similarIdeas = await this.findSimilarIdeas(application, otherApplications);
      
      let feedback = '';
      let metadata = {
        similarIdeas: JSON.parse(JSON.stringify(similarIdeas)),
        totalApplicationsChecked: otherApplications.length,
      };

      if (similarIdeas.length > 0) {
        // Sort by similarity score and get the best one
        const bestSimilar = similarIdeas[0];
        
        if (bestSimilar.problemSimilarity >= 0.85 && bestSimilar.solutionSimilarity >= 0.85) {
          feedback = `A likely duplicate was found in internal applications. `;
          feedback += `Most similar application: "${bestSimilar.title}" by ${bestSimilar.user.name} `;
          feedback += `(problem similarity: ${Math.round(bestSimilar.problemSimilarity * 100)}%; `;
          feedback += `solution similarity: ${Math.round(bestSimilar.solutionSimilarity * 100)}%). `;
          feedback += `This idea has already been submitted. Please choose a different idea and submit again.`;
          
          await this.databaseService.aIReview.update({
            where: { id: aiReview.id },
            data: {
              result: 'REJECTED',
              feedback,
              metadata,
              processedAt: new Date(),
              score: bestSimilar.similarity,
            },
          });

          await this.databaseService.application.update({
            where: { id: applicationId },
            data: {
              status: 'REJECTED',
              rejectionReason: feedback,
            },
          });
        } else {
          feedback = `Some similar ideas found but with low similarity (max: ${Math.round(bestSimilar.similarity * 100)}%). Proceeding to categorization.`;
          
          await this.databaseService.aIReview.update({
            where: { id: aiReview.id },
            data: {
              result: 'APPROVED',
              feedback,
              metadata,
              processedAt: new Date(),
              score: 1 - bestSimilar.similarity, // Higher score for lower similarity
            },
          });

          await this.databaseService.application.update({
            where: { id: applicationId },
            data: {
              status: 'CATEGORIZATION',
            },
          });
        }
      } else {
        feedback = 'No similar ideas found in internal applications. Proceeding to categorization.';
        
        await this.databaseService.aIReview.update({
          where: { id: aiReview.id },
          data: {
            result: 'APPROVED',
            feedback,
            metadata,
            processedAt: new Date(),
            score: 1.0, // Perfect score for unique idea
          },
        });

        await this.databaseService.application.update({
          where: { id: applicationId },
          data: {
            status: 'CATEGORIZATION',
          },
        });
      }

      this.logger.log(`Internal idea review completed for application ${applicationId}`);
    } catch (error) {
      this.logger.error(`Error in internal idea review for application ${applicationId}:`, error);
      
      await this.databaseService.aIReview.updateMany({
        where: { 
          applicationId,
          type: 'INTERNAL_IDEA',
        },
        data: {
          result: 'PENDING',
          errorMessage: error.message,
          processedAt: new Date(),
        },
      });
    }
  }

  private async findSimilarIdeas(currentApp: any, otherApps: any[]): Promise<any[]> {
    const similarities: any[] = [];

    for (const otherApp of otherApps) {
      const problemSimilarity = this.calculateTextSimilarity(
        `${currentApp.problemStatement} ${currentApp.description}`,
        `${otherApp.problemStatement} ${otherApp.description}`,
      );
      const solutionSimilarity = this.calculateTextSimilarity(currentApp.solution, otherApp.solution);
      const similarity = (problemSimilarity + solutionSimilarity) / 2;
      
      if (similarity > 0.3) { // Only consider if similarity is above 30%
        similarities.push({
          ...otherApp,
          similarity,
          problemSimilarity,
          solutionSimilarity,
        });
      }
    }

    // Sort by similarity score (highest first)
    return similarities.sort((a, b) => b.similarity - a.similarity);
  }

  private extractKeywords(text: string): string[] {
    // Remove common stop words and extract meaningful keywords
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
      'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
    ]);

    return text
      .split(/\W+/)
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 50); // Limit to top 50 keywords
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(this.extractKeywords(text1.toLowerCase()));
    const words2 = new Set(this.extractKeywords(text2.toLowerCase()));
    if (words1.size === 0 || words2.size === 0) return 0;

    const intersection = [...words1].filter((word) => words2.has(word)).length;
    const union = new Set([...words1, ...words2]).size;
    return intersection / union;
  }
}
