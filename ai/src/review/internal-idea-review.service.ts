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
        
        if (bestSimilar.similarity > 0.8) {
          feedback = `Similar idea found in internal applications. `;
          feedback += `Most similar application: "${bestSimilar.title}" by ${bestSimilar.user.name} `;
          feedback += `(${Math.round(bestSimilar.similarity * 100)}% similarity). `;
          feedback += `This application is rejected in favor of the earlier submission.`;
          
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
          result: 'REJECTED',
          errorMessage: error.message,
          processedAt: new Date(),
        },
      });
    }
  }

  private async findSimilarIdeas(currentApp: any, otherApps: any[]): Promise<any[]> {
    const similarities: any[] = [];

    for (const otherApp of otherApps) {
      const similarity = this.calculateSimilarity(currentApp, otherApp);
      
      if (similarity > 0.3) { // Only consider if similarity is above 30%
        similarities.push({
          ...otherApp,
          similarity,
        });
      }
    }

    // Sort by similarity score (highest first)
    return similarities.sort((a, b) => b.similarity - a.similarity);
  }

  private calculateSimilarity(app1: any, app2: any): number {
    // Simple similarity calculation based on text comparison
    // In a real implementation, you might use more sophisticated NLP techniques
    
    const text1 = `${app1.title} ${app1.description} ${app1.problemStatement} ${app1.solution}`.toLowerCase();
    const text2 = `${app2.title} ${app2.description} ${app2.problemStatement} ${app2.solution}`.toLowerCase();
    
    // Extract keywords and calculate overlap
    const words1 = this.extractKeywords(text1);
    const words2 = this.extractKeywords(text2);
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    const jaccardSimilarity = intersection.length / union.length;
    
    // Also check for title similarity
    const titleSimilarity = this.calculateTextSimilarity(app1.title.toLowerCase(), app2.title.toLowerCase());
    
    // Weighted average: 60% content similarity, 40% title similarity
    return jaccardSimilarity * 0.6 + titleSimilarity * 0.4;
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
    // Simple character-based similarity
    const longer = text1.length > text2.length ? text1 : text2;
    const shorter = text1.length > text2.length ? text2 : text1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}
