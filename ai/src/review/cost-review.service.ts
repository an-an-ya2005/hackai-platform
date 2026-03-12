import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class CostReviewService {
  private readonly logger = new Logger(CostReviewService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async reviewCostFeasibility(applicationId: string): Promise<void> {
    this.logger.log(`Starting cost feasibility review for application ${applicationId}`);

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
          type: 'COST_ANALYSIS',
          result: 'PENDING',
        },
      });

      // Analyze cost feasibility
      const costAnalysis = await this.analyzeCostFeasibility(application);
      
      const metadata = {
        ...costAnalysis,
        costBreakdown: costAnalysis.estimatedCosts,
        budgetAnalysis: {
          requestedBudget: application.estimatedCost || 0,
          estimatedCost: costAnalysis.totalEstimatedCost,
          variance: costAnalysis.costVariance,
          feasible: costAnalysis.isFeasible,
        },
      };

//      // Make cost stage non-blocking: provide guidance but do not reject
      let feedback = '';
      let result: 'APPROVED' | 'REJECTED' = 'APPROVED';

      if (!costAnalysis.isFeasible) {
        feedback = `Budget may be insufficient. `;
        feedback += `Requested: $${application.estimatedCost || 0}, Estimated: $${costAnalysis.totalEstimatedCost}. `;
        feedback += `Variance: ${costAnalysis.costVariance > 0 ? '+' : ''}${Math.round(costAnalysis.costVariance)}%. `;
        feedback += `Proceeding to impact review with recommendation: ${costAnalysis.recommendation}`;
      } else {
        feedback = `Cost analysis indicates budget is adequate. `;
        feedback += `Estimated cost: $${costAnalysis.totalEstimatedCost} vs requested: $${application.estimatedCost || 0}. `;
        feedback += costAnalysis.recommendation;
      }

      // Update AI review
      await this.databaseService.aIReview.update({
        where: { id: aiReview.id },
        data: {
          result,
          feedback,
          metadata: JSON.parse(JSON.stringify(metadata)),
          processedAt: new Date(),
          score: costAnalysis.feasibilityScore,
        },
      });

      // Always proceed to next stage (non-blocking cost review)
      await this.databaseService.application.update({
        where: { id: applicationId },
        data: {
          status: 'IMPACT_REVIEW',
        },
      });

      this.logger.log(`Cost feasibility review completed for application ${applicationId}: ${result}`);
    } catch (error) {
      this.logger.error(`Error in cost feasibility review for application ${applicationId}:`, error);
      
      await this.databaseService.aIReview.updateMany({
        where: { 
          applicationId,
          type: 'COST_ANALYSIS',
        },
        data: {
          result: 'REJECTED',
          errorMessage: error.message,
          processedAt: new Date(),
        },
      });
    }
  }

  private async analyzeCostFeasibility(application: any): Promise<any> {
    // Estimate development costs
    const developmentCosts = this.estimateDevelopmentCosts(application);
    
    // Estimate infrastructure costs
    const infrastructureCosts = this.estimateInfrastructureCosts(application);
    
    // Estimate third-party service costs
    const thirdPartyCosts = this.estimateThirdPartyCosts(application);
    
    // Estimate operational costs
    const operationalCosts = this.estimateOperationalCosts(application);
    
    const totalEstimatedCost = developmentCosts + infrastructureCosts + thirdPartyCosts + operationalCosts;
    const requestedBudget = application.estimatedCost || 0;
    
    // Calculate variance
    const costVariance = requestedBudget > 0 ? 
      ((totalEstimatedCost - requestedBudget) / requestedBudget) * 100 : 100;
    
    // Determine feasibility
    const isFeasible = requestedBudget >= totalEstimatedCost * 0.8; // Allow 20% variance
    
    // Calculate feasibility score
    const feasibilityScore = requestedBudget > 0 ? 
      Math.max(0, Math.min(1, requestedBudget / totalEstimatedCost)) : 0.5;

    // Generate recommendation
    let recommendation = '';
    if (isFeasible) {
      if (costVariance < -20) {
        recommendation = 'Budget is more than sufficient. Consider allocating additional resources to quality assurance or feature enhancement.';
      } else {
        recommendation = 'Budget is adequate for implementation with proper cost management.';
      }
    } else {
      recommendation = `Budget is insufficient. Consider increasing budget by approximately $${Math.round(totalEstimatedCost - requestedBudget)} or reducing scope.`;
    }

    return {
      estimatedCosts: {
        development: developmentCosts,
        infrastructure: infrastructureCosts,
        thirdParty: thirdPartyCosts,
        operational: operationalCosts,
      },
      totalEstimatedCost,
      requestedBudget,
      costVariance,
      isFeasible,
      feasibilityScore,
      recommendation,
      costBreakdownDetails: this.getCostBreakdownDetails(application),
    };
  }

  private estimateDevelopmentCosts(application: any): number {
    // Base development cost estimation
    const teamSize = application.teamSize;
    const complexity = this.assessComplexity(application);
    
    // Hourly rates (approximate)
    const hourlyRate = 50; // Average developer hourly rate
    
    // Estimated hours based on complexity
    let estimatedHours = 200; // Base hours
    
    if (complexity === 'high') estimatedHours = 800;
    else if (complexity === 'medium') estimatedHours = 400;
    else estimatedHours = 200;
    
    // Adjust for team size (more people might reduce time but increase coordination overhead)
    const teamAdjustment = teamSize > 3 ? 1.2 : 1.0;
    
    return Math.round(estimatedHours * hourlyRate * teamAdjustment);
  }

  private estimateInfrastructureCosts(application: any): number {
    const description = application.description.toLowerCase();
    const techStack = application.techStack.join(' ').toLowerCase();
    const text = `${description} ${techStack}`;
    
    let infrastructureCost = 0;
    
    // Cloud hosting
    if (text.includes('cloud') || text.includes('server') || text.includes('hosting')) {
      infrastructureCost += 100; // Monthly cloud hosting
    }
    
    // Database
    if (text.includes('database') || text.includes('db')) {
      infrastructureCost += 50; // Monthly database hosting
    }
    
    // CDN/Storage
    if (text.includes('cdn') || text.includes('storage') || text.includes('files')) {
      infrastructureCost += 30; // Monthly storage costs
    }
    
    // Scale for 6 months (typical project timeline)
    return infrastructureCost * 6;
  }

  private estimateThirdPartyCosts(application: any): number {
    const description = application.description.toLowerCase();
    const solution = application.solution.toLowerCase();
    const text = `${description} ${solution}`;
    
    let thirdPartyCost = 0;
    
    // Payment processing
    if (text.includes('payment') || text.includes('pay') || text.includes('transaction')) {
      thirdPartyCost += 200; // Payment gateway setup and monthly fees
    }
    
    // Authentication services
    if (text.includes('auth') || text.includes('login') || text.includes('user management')) {
      thirdPartyCost += 100; // Auth service costs
    }
    
    // Email services
    if (text.includes('email') || text.includes('notification') || text.includes('mail')) {
      thirdPartyCost += 50; // Email service costs
    }
    
    // SMS services
    if (text.includes('sms') || text.includes('text message')) {
      thirdPartyCost += 100; // SMS service costs
    }
    
    // API services
    if (text.includes('api') || text.includes('integration')) {
      thirdPartyCost += 150; // Various API costs
    }
    
    // Analytics
    if (text.includes('analytics') || text.includes('tracking')) {
      thirdPartyCost += 100; // Analytics service costs
    }
    
    return thirdPartyCost;
  }

  private estimateOperationalCosts(application: any): number {
    // Basic operational costs for 6 months
    let operationalCost = 200; // Base operational costs
    
    const teamSize = application.teamSize;
    const complexity = this.assessComplexity(application);
    
    // Adjust based on team size and complexity
    if (complexity === 'high') operationalCost += 300;
    else if (complexity === 'medium') operationalCost += 150;
    
    if (teamSize > 3) operationalCost += 100;
    
    return operationalCost;
  }

  private assessComplexity(application: any): 'low' | 'medium' | 'high' {
    const description = application.description.toLowerCase();
    const solution = application.solution.toLowerCase();
    const techStack = application.techStack.join(' ').toLowerCase();
    const text = `${description} ${solution} ${techStack}`;
    
    const highComplexityKeywords = [
      'machine learning', 'ai', 'blockchain', 'real-time', 'distributed',
      'microservices', 'kubernetes', 'big data', 'streaming', 'ar', 'vr'
    ];
    
    const mediumComplexityKeywords = [
      'api', 'database', 'authentication', 'payment', 'integration',
      'notification', 'search', 'analytics', 'dashboard', 'mobile'
    ];
    
    const highCount = highComplexityKeywords.filter(keyword => text.includes(keyword)).length;
    const mediumCount = mediumComplexityKeywords.filter(keyword => text.includes(keyword)).length;
    
    if (highCount > 0) return 'high';
    if (mediumCount > 2) return 'medium';
    return 'low';
  }

  private getCostBreakdownDetails(application: any): any {
    return {
      complexity: this.assessComplexity(application),
      teamSize: application.teamSize,
      estimatedTimeframe: this.assessComplexity(application) === 'high' ? '4-6 months' :
                          this.assessComplexity(application) === 'medium' ? '2-4 months' : '1-2 months',
      mainCostDrivers: this.identifyCostDrivers(application),
      potentialSavings: this.identifyPotentialSavings(application),
    };
  }

  private identifyCostDrivers(application: any): string[] {
    const text = `${application.description} ${application.solution} ${application.techStack.join(' ')}`.toLowerCase();
    const costDrivers: string[] = [];
    
    if (text.includes('machine learning') || text.includes('ai')) {
      costDrivers.push('AI/ML implementation complexity');
    }
    if (text.includes('real-time')) {
      costDrivers.push('Real-time system requirements');
    }
    if (text.includes('scalable') || text.includes('scale')) {
      costDrivers.push('Scalability requirements');
    }
    if (text.includes('security')) {
      costDrivers.push('Security implementation');
    }
    if (application.teamSize > 5) {
      costDrivers.push('Large team coordination overhead');
    }
    
    return costDrivers;
  }

  private identifyPotentialSavings(application: any): string[] {
    const text = `${application.description} ${application.solution} ${application.techStack.join(' ')}`.toLowerCase();
    const savings: string[] = [];
    
    if (text.includes('open source')) {
      savings.push('Using open-source technologies');
    }
    if (text.includes('mvp') || text.includes('minimal')) {
      savings.push('MVP approach reduces initial costs');
    }
    if (application.teamSize <= 3) {
      savings.push('Small team reduces coordination costs');
    }
    if (text.includes('existing') || text.includes('template')) {
      savings.push('Leveraging existing solutions/templates');
    }
    
    return savings;
  }
}
