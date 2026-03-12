import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class CustomerImpactReviewService {
  private readonly logger = new Logger(CustomerImpactReviewService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async reviewCustomerImpact(applicationId: string): Promise<void> {
    this.logger.log(`Starting customer impact review for application ${applicationId}`);

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
          type: 'CUSTOMER_IMPACT',
          result: 'PENDING',
        },
      });

      // Analyze customer impact
      const impactAnalysis = await this.analyzeCustomerImpact(application);
      
      const metadata = {
        ...impactAnalysis,
        impactMetrics: {
          problemSeverity: impactAnalysis.problemSeverity,
          marketSize: impactAnalysis.marketSize,
          solutionNovelty: impactAnalysis.solutionNovelty,
          businessViability: impactAnalysis.businessViability,
          userExperience: impactAnalysis.userExperience,
        },
      };

      let feedback = '';
      let result: 'APPROVED' | 'REJECTED' = 'APPROVED';

      if (impactAnalysis.overallImpactScore < 0.6) {
        result = 'REJECTED';
        feedback = `Customer impact assessment failed. Overall impact score: ${Math.round(impactAnalysis.overallImpactScore * 100)}%. `;
        feedback += `Issues identified: ${impactAnalysis.concerns.join(', ')}. `;
        feedback += impactAnalysis.recommendation;
      } else {
        feedback = `Customer impact assessment passed. Overall impact score: ${Math.round(impactAnalysis.overallImpactScore * 100)}%. `;
        feedback += `Strengths: ${impactAnalysis.strengths.join(', ')}. `;
        feedback += impactAnalysis.recommendation;
      }

      // Update AI review
      await this.databaseService.aIReview.update({
        where: { id: aiReview.id },
        data: {
          result,
          feedback,
          metadata: JSON.parse(JSON.stringify(metadata)),
          processedAt: new Date(),
          score: impactAnalysis.overallImpactScore,
        },
      });

      if (result === 'REJECTED') {
        await this.databaseService.application.update({
          where: { id: applicationId },
          data: {
            status: 'REJECTED',
            rejectionReason: feedback,
          },
        });
      } else {
        // Move to admin decision after AI report is generated
        await this.databaseService.application.update({
          where: { id: applicationId },
          data: {
            status: 'UNDER_REVIEW',
            rejectionReason: null,
          },
        });
      }

      this.logger.log(`Customer impact review completed for application ${applicationId}: ${result}`);
    } catch (error) {
      this.logger.error(`Error in customer impact review for application ${applicationId}:`, error);
      
      await this.databaseService.aIReview.updateMany({
        where: { 
          applicationId,
          type: 'CUSTOMER_IMPACT',
        },
        data: {
          result: 'REJECTED',
          errorMessage: error.message,
          processedAt: new Date(),
        },
      });
    }
  }

  private async analyzeCustomerImpact(application: any): Promise<any> {
    // Analyze different aspects of customer impact
    const problemSeverity = this.analyzeProblemSeverity(application);
    const marketSize = this.analyzeMarketSize(application);
    const solutionNovelty = this.analyzeSolutionNovelty(application);
    const businessViability = this.analyzeBusinessViability(application);
    const userExperience = this.analyzeUserExperience(application);
    
    // Calculate overall impact score (weighted average)
    const overallImpactScore = (
      problemSeverity * 0.25 +
      marketSize * 0.2 +
      solutionNovelty * 0.2 +
      businessViability * 0.2 +
      userExperience * 0.15
    );

    // Identify strengths and concerns
    const strengths: string[] = [];
    const concerns: string[] = [];

    if (problemSeverity >= 0.7) strengths.push('Addresses significant problem');
    else if (problemSeverity < 0.5) concerns.push('Problem significance unclear');

    if (marketSize >= 0.7) strengths.push('Large market potential');
    else if (marketSize < 0.5) concerns.push('Limited market size');

    if (solutionNovelty >= 0.7) strengths.push('Innovative solution approach');
    else if (solutionNovelty < 0.5) concerns.push('Solution lacks novelty');

    if (businessViability >= 0.7) strengths.push('Strong business potential');
    else if (businessViability < 0.5) concerns.push('Questionable business viability');

    if (userExperience >= 0.7) strengths.push('Excellent user experience potential');
    else if (userExperience < 0.5) concerns.push('Poor user experience design');

    // Generate recommendation
    let recommendation = '';
    if (overallImpactScore >= 0.8) {
      recommendation = 'Excellent customer impact potential. Strong recommendation for approval.';
    } else if (overallImpactScore >= 0.6) {
      recommendation = 'Good customer impact potential. Approved with suggested improvements.';
    } else {
      recommendation = 'Insufficient customer impact. Requires significant improvements or scope changes.';
    }

    return {
      problemSeverity,
      marketSize,
      solutionNovelty,
      businessViability,
      userExperience,
      overallImpactScore,
      strengths,
      concerns,
      recommendation,
      detailedAnalysis: {
        problemAnalysis: this.getProblemAnalysisDetails(application),
        marketAnalysis: this.getMarketAnalysisDetails(application),
        solutionAnalysis: this.getSolutionAnalysisDetails(application),
        businessAnalysis: this.getBusinessAnalysisDetails(application),
        uxAnalysis: this.getUXAnalysisDetails(application),
      },
    };
  }

  private analyzeProblemSeverity(application: any): number {
    const problemStatement = application.problemStatement.toLowerCase();
    const description = application.description.toLowerCase();
    const text = `${problemStatement} ${description}`;
    
    // Keywords indicating problem severity
    const highSeverityKeywords = [
      'critical', 'urgent', 'major', 'significant', 'serious', 'important',
      'pain point', 'frustrating', 'inefficient', 'time-consuming', 'costly',
      'difficult', 'challenging', 'problem', 'issue', 'struggle'
    ];
    
    const impactKeywords = [
      'waste', 'loss', 'expensive', 'slow', 'manual', 'outdated',
      'ineffective', 'broken', 'limited', 'restricted'
    ];
    
    let severityScore = 0.5; // Default moderate severity
    
    // Check for severity indicators
    const severityMatches = highSeverityKeywords.filter(keyword => text.includes(keyword)).length;
    const impactMatches = impactKeywords.filter(keyword => text.includes(keyword)).length;
    
    severityScore += (severityMatches * 0.1) + (impactMatches * 0.08);
    
    // Check for quantified problems (numbers, percentages)
    const numberRegex = /\d+%|\d+\s*(hours?|minutes?|days?|dollars?|\$)/gi;
    if (numberRegex.test(text)) {
      severityScore += 0.2; // Quantified problems are typically more severe
    }
    
    return Math.min(1, severityScore);
  }

  private analyzeMarketSize(application: any): number {
    const description = application.description.toLowerCase();
    const problemStatement = application.problemStatement.toLowerCase();
    const text = `${description} ${problemStatement}`;
    
    // Market size indicators
    const largMarketKeywords = [
      'everyone', 'all users', 'global', 'worldwide', 'enterprise', 'business',
      'companies', 'organizations', 'millions', 'thousands', 'popular', 'common'
    ];
    
    const specificMarketKeywords = [
      'developers', 'students', 'professionals', 'managers', 'teams',
      'small business', 'startups', 'freelancers'
    ];
    
    const nicheKeywords = [
      'specific', 'specialized', 'niche', 'particular', 'certain group',
      'limited to', 'only for'
    ];
    
    let marketScore = 0.5; // Default moderate market
    
    const largeMatches = largMarketKeywords.filter(keyword => text.includes(keyword)).length;
    const specificMatches = specificMarketKeywords.filter(keyword => text.includes(keyword)).length;
    const nicheMatches = nicheKeywords.filter(keyword => text.includes(keyword)).length;
    
    marketScore += largeMatches * 0.15;
    marketScore += specificMatches * 0.1;
    marketScore -= nicheMatches * 0.1;
    
    return Math.max(0.2, Math.min(1, marketScore));
  }

  private analyzeSolutionNovelty(application: any): number {
    const solution = application.solution.toLowerCase();
    const description = application.description.toLowerCase();
    const text = `${solution} ${description}`;
    
    // Innovation indicators
    const innovationKeywords = [
      'new', 'novel', 'innovative', 'unique', 'first', 'revolutionary',
      'breakthrough', 'cutting-edge', 'advanced', 'modern', 'fresh'
    ];
    
    const improveKeywords = [
      'better', 'improved', 'enhanced', 'optimized', 'efficient',
      'faster', 'easier', 'simpler', 'automated'
    ];
    
    const existingKeywords = [
      'existing', 'current', 'traditional', 'standard', 'conventional',
      'similar to', 'like existing', 'copy'
    ];
    
    let noveltyScore = 0.5; // Default moderate novelty
    
    const innovationMatches = innovationKeywords.filter(keyword => text.includes(keyword)).length;
    const improveMatches = improveKeywords.filter(keyword => text.includes(keyword)).length;
    const existingMatches = existingKeywords.filter(keyword => text.includes(keyword)).length;
    
    noveltyScore += innovationMatches * 0.15;
    noveltyScore += improveMatches * 0.1;
    noveltyScore -= existingMatches * 0.1;
    
    return Math.max(0.2, Math.min(1, noveltyScore));
  }

  private analyzeBusinessViability(application: any): number {
    const description = application.description.toLowerCase();
    const solution = application.solution.toLowerCase();
    const text = `${description} ${solution}`;
    
    // Business viability indicators
    const revenueKeywords = [
      'revenue', 'profit', 'monetize', 'subscription', 'payment',
      'business model', 'pricing', 'sell', 'commercial'
    ];
    
    const scalabilityKeywords = [
      'scalable', 'scale', 'growth', 'expand', 'multiple users',
      'enterprise', 'b2b', 'saas'
    ];
    
    const sustainabilityKeywords = [
      'sustainable', 'long-term', 'recurring', 'retention',
      'customer lifetime', 'repeat'
    ];
    
    let viabilityScore = 0.5; // Default moderate viability
    
    const revenueMatches = revenueKeywords.filter(keyword => text.includes(keyword)).length;
    const scalabilityMatches = scalabilityKeywords.filter(keyword => text.includes(keyword)).length;
    const sustainabilityMatches = sustainabilityKeywords.filter(keyword => text.includes(keyword)).length;
    
    viabilityScore += revenueMatches * 0.12;
    viabilityScore += scalabilityMatches * 0.1;
    viabilityScore += sustainabilityMatches * 0.08;
    
    // Check if estimated cost is provided (shows business thinking)
    if (application.estimatedCost && application.estimatedCost > 0) {
      viabilityScore += 0.1;
    }
    
    return Math.min(1, viabilityScore);
  }

  private analyzeUserExperience(application: any): number {
    const description = application.description.toLowerCase();
    const solution = application.solution.toLowerCase();
    const text = `${description} ${solution}`;
    
    // UX indicators
    const positiveUXKeywords = [
      'easy', 'simple', 'intuitive', 'user-friendly', 'accessible',
      'seamless', 'smooth', 'convenient', 'effortless', 'quick'
    ];
    
    const designKeywords = [
      'design', 'interface', 'ui', 'ux', 'experience', 'usability',
      'mobile-friendly', 'responsive', 'modern'
    ];
    
    const negativeUXKeywords = [
      'complex', 'complicated', 'difficult', 'confusing',
      'hard to use', 'technical', 'advanced'
    ];
    
    let uxScore = 0.5; // Default moderate UX
    
    const positiveMatches = positiveUXKeywords.filter(keyword => text.includes(keyword)).length;
    const designMatches = designKeywords.filter(keyword => text.includes(keyword)).length;
    const negativeMatches = negativeUXKeywords.filter(keyword => text.includes(keyword)).length;
    
    uxScore += positiveMatches * 0.12;
    uxScore += designMatches * 0.08;
    uxScore -= negativeMatches * 0.1;
    
    return Math.max(0.2, Math.min(1, uxScore));
  }

  private getProblemAnalysisDetails(application: any): any {
    return {
      problemStatement: application.problemStatement,
      severityIndicators: this.extractSeverityIndicators(application),
      quantifiedElements: this.extractQuantifiedElements(application),
    };
  }

  private getMarketAnalysisDetails(application: any): any {
    return {
      targetAudience: this.extractTargetAudience(application),
      marketSizeIndicators: this.extractMarketSizeIndicators(application),
      competitiveAdvantage: this.extractCompetitiveAdvantage(application),
    };
  }

  private getSolutionAnalysisDetails(application: any): any {
    return {
      solutionApproach: application.solution,
      innovationElements: this.extractInnovationElements(application),
      differentiators: this.extractDifferentiators(application),
    };
  }

  private getBusinessAnalysisDetails(application: any): any {
    return {
      businessModel: this.extractBusinessModel(application),
      revenueIndicators: this.extractRevenueIndicators(application),
      scalabilityFactors: this.extractScalabilityFactors(application),
    };
  }

  private getUXAnalysisDetails(application: any): any {
    return {
      userExperienceElements: this.extractUXElements(application),
      accessibilityConsiderations: this.extractAccessibilityElements(application),
      designMentions: this.extractDesignMentions(application),
    };
  }

  private extractSeverityIndicators(application: any): string[] {
    const text = `${application.problemStatement} ${application.description}`.toLowerCase();
    const indicators = ['critical', 'urgent', 'major', 'significant', 'pain point', 'frustrating'];
    return indicators.filter(indicator => text.includes(indicator));
  }

  private extractQuantifiedElements(application: any): string[] {
    const text = `${application.problemStatement} ${application.description}`;
    const numberRegex = /\d+%|\d+\s*(hours?|minutes?|days?|dollars?|\$|\w+)/gi;
    return text.match(numberRegex) || [];
  }

  private extractTargetAudience(application: any): string[] {
    const text = `${application.description} ${application.problemStatement}`.toLowerCase();
    const audiences = ['developers', 'students', 'professionals', 'managers', 'teams', 'businesses', 'users'];
    return audiences.filter(audience => text.includes(audience));
  }

  private extractMarketSizeIndicators(application: any): string[] {
    const text = `${application.description} ${application.problemStatement}`.toLowerCase();
    const indicators = ['global', 'worldwide', 'enterprise', 'millions', 'thousands', 'everyone'];
    return indicators.filter(indicator => text.includes(indicator));
  }

  private extractCompetitiveAdvantage(application: any): string[] {
    const text = `${application.solution} ${application.description}`.toLowerCase();
    const advantages = ['better', 'faster', 'cheaper', 'easier', 'more efficient', 'unique', 'innovative'];
    return advantages.filter(advantage => text.includes(advantage));
  }

  private extractInnovationElements(application: any): string[] {
    const text = `${application.solution} ${application.description}`.toLowerCase();
    const innovations = ['new', 'innovative', 'novel', 'unique', 'breakthrough', 'cutting-edge'];
    return innovations.filter(innovation => text.includes(innovation));
  }

  private extractDifferentiators(application: any): string[] {
    const text = `${application.solution} ${application.description}`.toLowerCase();
    const differentiators = ['unlike', 'different from', 'compared to', 'advantage', 'benefit'];
    return differentiators.filter(diff => text.includes(diff));
  }

  private extractBusinessModel(application: any): string[] {
    const text = `${application.solution} ${application.description}`.toLowerCase();
    const models = ['subscription', 'freemium', 'saas', 'marketplace', 'advertising', 'transaction'];
    return models.filter(model => text.includes(model));
  }

  private extractRevenueIndicators(application: any): string[] {
    const text = `${application.solution} ${application.description}`.toLowerCase();
    const indicators = ['revenue', 'profit', 'monetize', 'pricing', 'payment', 'sell'];
    return indicators.filter(indicator => text.includes(indicator));
  }

  private extractScalabilityFactors(application: any): string[] {
    const text = `${application.solution} ${application.description}`.toLowerCase();
    const factors = ['scalable', 'scale', 'growth', 'expand', 'multiple users', 'enterprise'];
    return factors.filter(factor => text.includes(factor));
  }

  private extractUXElements(application: any): string[] {
    const text = `${application.solution} ${application.description}`.toLowerCase();
    const elements = ['easy', 'simple', 'intuitive', 'user-friendly', 'seamless', 'convenient'];
    return elements.filter(element => text.includes(element));
  }

  private extractAccessibilityElements(application: any): string[] {
    const text = `${application.solution} ${application.description}`.toLowerCase();
    const elements = ['accessible', 'mobile-friendly', 'responsive', 'cross-platform'];
    return elements.filter(element => text.includes(element));
  }

  private extractDesignMentions(application: any): string[] {
    const text = `${application.solution} ${application.description}`.toLowerCase();
    const mentions = ['design', 'interface', 'ui', 'ux', 'experience', 'usability'];
    return mentions.filter(mention => text.includes(mention));
  }
}
