import { DatabaseService } from '../database/database.service';
import { MCPClientService } from '../mcp/mcp-client.service';
import { ExternalIdeaReviewService } from './external-idea-review.service';
import { ImplementationReviewService } from './implementation-review.service';
import { InternalIdeaReviewService } from './internal-idea-review.service';
import { CategorizationService } from './categorization.service';
import { CostReviewService } from './cost-review.service';
import { CustomerImpactReviewService } from './customer-impact-review.service';
import { HttpService } from '@nestjs/axios';
import { WebSocketClient } from '../websocket/websocket-client.service';
import { AIReviewOrchestratorService } from './ai-review-orchestrator.service';
import { detectClearProblemSolutionMismatch } from './problem-solution-fit';
import { detectClearlyShallowStudyIdea } from './idea-merit';

describe('AI review decision policy', () => {
  it('detects only strong, unrelated problem and solution domains', () => {
    expect(detectClearProblemSolutionMismatch(
      'Affordable student rental housing has scattered apartment listings and landlords are difficult to reach.',
      'A study planner creates timetables with Pomodoro timers and exam reminders.',
    ).isMismatch).toBe(true);

    expect(detectClearProblemSolutionMismatch(
      'Affordable rental housing has scattered apartment listings.',
      'A housing marketplace lists affordable apartments and connects renters with landlords.',
    ).isMismatch).toBe(false);

    expect(detectClearProblemSolutionMismatch(
      'Students need a simple way to stay organized.',
      'A lightweight planner helps students track daily tasks.',
    ).isMismatch).toBe(false);
  });

  it('detects a generic study problem paired with generic planner features', () => {
    expect(detectClearlyShallowStudyIdea(
      'Students have study problems.',
      'A study timetable with Pomodoro timers and reminders.',
    )).toEqual(expect.objectContaining({
      isClearlyShallow: true,
      confidence: 0.95,
    }));

    expect(detectClearlyShallowStudyIdea(
      'Students with irregular work schedules miss exam-preparation sessions and risk failing required courses.',
      'A planner combines course deadlines and work shifts to create a personalized study plan and helps students recover missed sessions.',
    ).isClearlyShallow).toBe(false);
  });

  it('sends low implementation feasibility scores to admins instead of rejecting', async () => {
    const application = {
      id: 'application-1',
      description: 'An advanced, comprehensive, enterprise blockchain platform with real-time integrations.',
      solution: 'A sophisticated machine learning system with microservices and distributed processing.',
      techStack: ['blockchain', 'machine learning', 'deep learning', 'microservices'],
      teamSize: 1,
      teamMembers: [],
    };
    const databaseService = {
      application: {
        findUnique: jest.fn().mockResolvedValue(application),
        update: jest.fn(),
      },
      aIReview: {
        create: jest.fn().mockResolvedValue({ id: 'review-1' }),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    } as unknown as DatabaseService;
    const service = new ImplementationReviewService(databaseService);

    await service.reviewImplementationFeasibility(application.id);

    expect(databaseService.aIReview.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        result: 'APPROVED',
        score: expect.any(Number),
        feedback: expect.stringContaining('concerns for admin review'),
      }),
    }));
    expect(databaseService.application.update).toHaveBeenCalledWith({
      where: { id: application.id },
      data: { status: 'COST_REVIEW' },
    });
  });

  it('does not reject shared-problem ideas when their proposed solutions differ', async () => {
    const application = {
      id: 'application-1',
      title: 'Hostel maintenance requests',
      description: 'Students in hostels struggle to report maintenance issues promptly.',
      problemStatement: 'Students cannot get hostel maintenance problems resolved promptly.',
      solution: 'A mobile ticketing app routes repair requests to facilities staff.',
    };
    const otherApplication = {
      id: 'application-2',
      title: 'Predictive hostel repairs',
      description: application.description,
      problemStatement: application.problemStatement,
      solution: 'IoT sensors detect equipment failures and dispatch repair contractors automatically.',
      createdAt: new Date(),
      user: { name: 'Another applicant', email: 'applicant@example.com' },
    };
    const databaseService = {
      application: {
        findUnique: jest.fn().mockResolvedValue(application),
        findMany: jest.fn().mockResolvedValue([otherApplication]),
        update: jest.fn(),
      },
      aIReview: {
        create: jest.fn().mockResolvedValue({ id: 'review-1' }),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    } as unknown as DatabaseService;
    const service = new InternalIdeaReviewService(databaseService);

    await service.reviewIdea(application.id);

    expect(databaseService.aIReview.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ result: 'APPROVED' }),
    }));
    expect(databaseService.application.update).toHaveBeenCalledWith({
      where: { id: application.id },
      data: { status: 'CATEGORIZATION' },
    });
  });

  it('rejects an internal idea only when both problem and solution are clear matches', async () => {
    const application = {
      id: 'application-1',
      title: 'Hostel maintenance requests',
      description: 'Students in hostels struggle to report maintenance issues promptly.',
      problemStatement: 'Students cannot get hostel maintenance problems resolved promptly.',
      solution: 'A mobile ticketing app routes repair requests to facilities staff.',
    };
    const otherApplication = {
      id: 'application-2',
      title: 'Hostel maintenance requests',
      description: application.description,
      problemStatement: application.problemStatement,
      solution: application.solution,
      createdAt: new Date(),
      user: { name: 'Another applicant', email: 'applicant@example.com' },
    };
    const databaseService = {
      application: {
        findUnique: jest.fn().mockResolvedValue(application),
        findMany: jest.fn().mockResolvedValue([otherApplication]),
        update: jest.fn(),
      },
      aIReview: {
        create: jest.fn().mockResolvedValue({ id: 'review-1' }),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    } as unknown as DatabaseService;
    const service = new InternalIdeaReviewService(databaseService);

    await service.reviewIdea(application.id);

    expect(databaseService.aIReview.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        result: 'REJECTED',
        feedback: expect.stringContaining('Please choose a different idea'),
      }),
    }));
    expect(databaseService.application.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'REJECTED' }),
    }));
  });

  it('routes external similarity results below the duplicate threshold to admin review', async () => {
    const application = {
      id: 'application-1',
      title: 'Hostel maintenance requests',
      description: 'A hostel maintenance request service.',
      problemStatement: 'Students cannot get hostel maintenance problems resolved promptly.',
      solution: 'A mobile ticketing app routes repair requests to facilities staff.',
      userId: 'user-1',
    };
    const databaseService = {
      application: {
        findUnique: jest.fn().mockResolvedValue(application),
        update: jest.fn(),
      },
      aIReview: {
        create: jest.fn().mockResolvedValue({ id: 'review-1' }),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    } as unknown as DatabaseService;
    const mcpClient = {
      fetchYCCompanies: jest.fn().mockResolvedValue([{ name: 'ExampleCo' }]),
      analyzeIdeaSimilarity: jest.fn().mockResolvedValue({
        isSimilar: true,
        similarityScore: 0.9,
        companyMatchVerified: true,
        rejectionType: 'CLEAR_DUPLICATE',
        problemSimilarity: 0.98,
        solutionSimilarity: 0.84,
        recommendation: 'REJECT',
        feedback: 'Potentially similar company identified.',
        mostSimilarCompany: { name: 'ExampleCo', reason: 'Similar area' },
      }),
    } as unknown as MCPClientService;
    const webSocketClient = {
      ensureConnection: jest.fn(),
      isConnected: jest.fn().mockReturnValue(true),
      sendAIReviewProgress: jest.fn(),
      sendApplicationRejection: jest.fn(),
    } as unknown as WebSocketClient;
    const service = new ExternalIdeaReviewService(
      {} as HttpService,
      databaseService,
      webSocketClient,
      mcpClient,
    );

    await service.reviewIdea(application.id);

    expect(databaseService.aIReview.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ result: 'APPROVED' }),
    }));
    expect(databaseService.application.update).toHaveBeenCalledWith({
      where: { id: application.id },
      data: { status: 'INTERNAL_IDEA_REVIEW' },
    });
    expect(webSocketClient.sendApplicationRejection).not.toHaveBeenCalled();
  });

  it('rejects a clearly shallow idea only when the AI is highly confident', async () => {
    const application = {
      id: 'application-1',
      title: 'Study motivation planner',
      description: 'A study planner that sends motivational quotes and reminders.',
      problemStatement: 'Students balancing coursework and part-time jobs have difficulty maintaining a consistent revision routine.',
      solution: 'The app sends motivational quotes and basic study reminders.',
      userId: 'user-1',
    };
    const databaseService = {
      application: {
        findUnique: jest.fn().mockResolvedValue(application),
        update: jest.fn(),
      },
      aIReview: {
        create: jest.fn().mockResolvedValue({ id: 'review-1' }),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    } as unknown as DatabaseService;
    const mcpClient = {
      fetchYCCompanies: jest.fn().mockResolvedValue([]),
      analyzeIdeaSimilarity: jest.fn().mockResolvedValue({
        isSimilar: false,
        similarityScore: 0,
        recommendation: 'APPROVE',
        feedback: 'The idea has limited value.',
        ideaMeritDecision: 'CLEARLY_LOW_VALUE',
        ideaMeritConfidence: 0.96,
        ideaMeritReason: 'The need is vague and the features provide no concrete outcome.',
      }),
    } as unknown as MCPClientService;
    const webSocketClient = {
      ensureConnection: jest.fn(),
      isConnected: jest.fn().mockReturnValue(true),
      sendAIReviewProgress: jest.fn(),
      sendApplicationRejection: jest.fn(),
    } as unknown as WebSocketClient;
    const service = new ExternalIdeaReviewService(
      {} as HttpService,
      databaseService,
      webSocketClient,
      mcpClient,
    );

    await service.reviewIdea(application.id);

    expect(databaseService.aIReview.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        result: 'REJECTED',
        score: 0.96,
        feedback: expect.stringContaining('does not present a sufficiently meaningful hackathon problem'),
        metadata: expect.objectContaining({ rejectionReason: 'CLEARLY_LOW_VALUE' }),
      }),
    }));
    expect(databaseService.application.update).toHaveBeenCalledWith({
      where: { id: application.id },
      data: expect.objectContaining({ status: 'REJECTED' }),
    });
    expect(webSocketClient.sendApplicationRejection).toHaveBeenCalled();
  });

  it('rejects the generic study-problem example before relying on an AI provider', async () => {
    const application = {
      id: 'application-1',
      title: 'Study planner',
      description: 'A web app for college students with schedules, timers, and reminders.',
      problemStatement: 'Students have study problems.',
      solution: 'The app lets students make a study timetable, set Pomodoro timers, and get reminders.',
      userId: 'user-1',
    };
    const databaseService = {
      application: {
        findUnique: jest.fn().mockResolvedValue(application),
        update: jest.fn(),
      },
      aIReview: {
        create: jest.fn().mockResolvedValue({ id: 'review-1' }),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    } as unknown as DatabaseService;
    const mcpClient = {
      fetchYCCompanies: jest.fn(),
      analyzeIdeaSimilarity: jest.fn(),
    } as unknown as MCPClientService;
    const webSocketClient = {
      ensureConnection: jest.fn(),
      isConnected: jest.fn().mockReturnValue(true),
      sendAIReviewProgress: jest.fn(),
      sendApplicationRejection: jest.fn(),
    } as unknown as WebSocketClient;
    const service = new ExternalIdeaReviewService(
      {} as HttpService,
      databaseService,
      webSocketClient,
      mcpClient,
    );

    await service.reviewIdea(application.id);

    expect(databaseService.aIReview.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        result: 'REJECTED',
        score: 0.95,
        metadata: expect.objectContaining({
          rejectionReason: 'CLEARLY_LOW_VALUE',
          analysisMethod: 'CLEAR_SHALLOW_STUDY_IDEA_CHECK',
        }),
      }),
    }));
    expect(databaseService.application.update).toHaveBeenCalledWith({
      where: { id: application.id },
      data: expect.objectContaining({ status: 'REJECTED' }),
    });
    expect(mcpClient.analyzeIdeaSimilarity).not.toHaveBeenCalled();
    expect(webSocketClient.sendApplicationRejection).toHaveBeenCalledWith(
      application.id,
      expect.objectContaining({ userId: application.userId }),
    );
  });

  it('sends borderline or merely simple ideas to admin review instead of rejecting', async () => {
    const application = {
      id: 'application-1',
      title: 'Simple study planner',
      description: 'A lightweight planner helps students keep track of study sessions.',
      problemStatement: 'Students with irregular schedules struggle to keep up with exam preparation.',
      solution: 'A simple planner helps students schedule study sessions and receive reminders.',
      userId: 'user-1',
    };
    const databaseService = {
      application: {
        findUnique: jest.fn().mockResolvedValue(application),
        update: jest.fn(),
      },
      aIReview: {
        create: jest.fn().mockResolvedValue({ id: 'review-1' }),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    } as unknown as DatabaseService;
    const mcpClient = {
      fetchYCCompanies: jest.fn().mockResolvedValue([]),
      analyzeIdeaSimilarity: jest.fn().mockResolvedValue({
        isSimilar: false,
        similarityScore: 0,
        recommendation: 'APPROVE',
        feedback: 'A modest idea that may help a specific audience.',
        ideaMeritDecision: 'REVIEW',
        ideaMeritConfidence: 0.72,
        ideaMeritReason: 'The need may be meaningful but needs administrator judgment.',
      }),
    } as unknown as MCPClientService;
    const webSocketClient = {
      ensureConnection: jest.fn(),
      isConnected: jest.fn().mockReturnValue(true),
      sendAIReviewProgress: jest.fn(),
      sendApplicationRejection: jest.fn(),
    } as unknown as WebSocketClient;
    const service = new ExternalIdeaReviewService(
      {} as HttpService,
      databaseService,
      webSocketClient,
      mcpClient,
    );

    await service.reviewIdea(application.id);

    expect(databaseService.aIReview.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ result: 'APPROVED' }),
    }));
    expect(databaseService.application.update).toHaveBeenCalledWith({
      where: { id: application.id },
      data: { status: 'INTERNAL_IDEA_REVIEW' },
    });
    expect(webSocketClient.sendApplicationRejection).not.toHaveBeenCalled();
  });

  it('rejects a clear housing problem and study-planner solution mismatch', async () => {
    const application = {
      id: 'application-1',
      title: 'Study Planner',
      description: 'A study planner with a timetable, Pomodoro timers, and exam reminders.',
      problemStatement: 'Affordable student rental housing is difficult to find because apartment listings are scattered and landlords are hard to contact.',
      solution: 'A study planner creates a timetable with Pomodoro timers, exam reminders, and daily focus routines.',
      userId: 'user-1',
    };
    const databaseService = {
      application: {
        findUnique: jest.fn().mockResolvedValue(application),
        update: jest.fn(),
      },
      aIReview: {
        create: jest.fn().mockResolvedValue({ id: 'review-1' }),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    } as unknown as DatabaseService;
    const mcpClient = {
      fetchYCCompanies: jest.fn(),
      analyzeIdeaSimilarity: jest.fn(),
    } as unknown as MCPClientService;
    const webSocketClient = {
      ensureConnection: jest.fn(),
      isConnected: jest.fn().mockReturnValue(true),
      sendAIReviewProgress: jest.fn(),
      sendApplicationRejection: jest.fn(),
    } as unknown as WebSocketClient;
    const service = new ExternalIdeaReviewService(
      {} as HttpService,
      databaseService,
      webSocketClient,
      mcpClient,
    );

    await service.reviewIdea(application.id);

    expect(databaseService.aIReview.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        result: 'REJECTED',
        metadata: expect.objectContaining({ rejectionReason: 'PROBLEM_SOLUTION_MISMATCH' }),
      }),
    }));
    expect(databaseService.application.update).toHaveBeenCalledWith({
      where: { id: application.id },
      data: expect.objectContaining({ status: 'REJECTED' }),
    });
    expect(mcpClient.analyzeIdeaSimilarity).not.toHaveBeenCalled();
    expect(webSocketClient.sendApplicationRejection).toHaveBeenCalledWith(
      application.id,
      expect.objectContaining({ userId: application.userId }),
    );
  });

  it('notifies admins about rejected applications without changing the rejection status', async () => {
    const submittedApplication = {
      id: 'application-1',
      status: 'SUBMITTED',
      user: { id: 'user-1' },
      aiReviews: [],
    };
    const rejectedApplication = {
      id: 'application-1',
      status: 'REJECTED',
      title: 'Study Planner',
      rejectionReason: 'The solution does not address the stated problem.',
      user: { name: 'Applicant' },
      aiReviews: [{
        result: 'REJECTED',
        feedback: 'The solution does not address the stated problem.',
      }],
    };
    const databaseService = {
      application: {
        findUnique: jest.fn()
          .mockResolvedValueOnce(submittedApplication)
          .mockResolvedValueOnce(rejectedApplication)
          .mockResolvedValueOnce(rejectedApplication),
        update: jest.fn(),
      },
      user: { findMany: jest.fn().mockResolvedValue([{ id: 'admin-1' }]) },
      notification: { createMany: jest.fn() },
    } as unknown as DatabaseService;
    const externalIdeaReviewService = { reviewIdea: jest.fn() } as unknown as ExternalIdeaReviewService;
    const internalIdeaReviewService = { reviewIdea: jest.fn() } as unknown as InternalIdeaReviewService;
    const service = new AIReviewOrchestratorService(
      databaseService,
      externalIdeaReviewService,
      internalIdeaReviewService,
      {} as unknown as CategorizationService,
      {} as unknown as ImplementationReviewService,
      {} as unknown as CostReviewService,
      {} as unknown as CustomerImpactReviewService,
    );

    await service.processApplicationReview('application-1');

    expect(databaseService.notification.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({
        userId: 'admin-1',
        title: 'AI review rejected an application',
        actionUrl: '/admin/applications/application-1',
        message: expect.stringContaining('The solution does not address the stated problem.'),
      })],
    });
    expect(databaseService.application.update).toHaveBeenCalledWith({
      where: { id: 'application-1' },
      data: { status: 'EXTERNAL_IDEA_REVIEW' },
    });
  });
});
