import { DatabaseService } from '../database/database.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AIServiceClient } from './ai-service-client.service';
import { ApplicationsService } from './applications.service';
import { ApplicationStatusGateway } from '../websocket/application-status.gateway';
import { UpdateApplicationDto } from './dto/update-application.dto';

describe('ApplicationsService participant idea management', () => {
  it('resets an edited participant application to draft and clears old reviews', async () => {
    const application = {
      id: 'application-1',
      userId: 'participant-1',
      status: 'REJECTED',
      isActive: true,
    };
    const transaction = {
      aIReview: { deleteMany: jest.fn() },
      review: { deleteMany: jest.fn() },
      application: {
        update: jest.fn().mockResolvedValue({ ...application, status: 'DRAFT', title: 'Updated idea' }),
      },
    };
    const databaseService = {
      application: { findUnique: jest.fn().mockResolvedValue(application) },
      $transaction: jest.fn((callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction)),
    } as unknown as DatabaseService;
    const notificationsService = {
      createApplicationStatusNotification: jest.fn(),
    } as unknown as NotificationsService;
    const service = new ApplicationsService(
      databaseService,
      notificationsService,
      {} as AIServiceClient,
      {} as ApplicationStatusGateway,
    );

    await service.update(
      application.id,
      { title: 'Updated idea' } as UpdateApplicationDto,
      application.userId,
      'PARTICIPANT',
    );

    expect(transaction.aIReview.deleteMany).toHaveBeenCalledWith({
      where: { applicationId: application.id },
    });

    expect(transaction.review.deleteMany).toHaveBeenCalledWith({
      where: { applicationId: application.id },
    });
    expect(transaction.application.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        title: 'Updated idea',
        status: 'DRAFT',
        submittedAt: null,
        category: null,
        rejectionReason: null,
      }),
    }));
    expect(notificationsService.createApplicationStatusNotification).toHaveBeenCalledWith(
      application.id,
      application.userId,
      'DRAFT',
    );
  });

  it('soft-deletes an application so it no longer appears in active lists', async () => {
    const application = {
      id: 'application-1',
      userId: 'participant-1',
      isActive: true,
    };
    const databaseService = {
      application: {
        findUnique: jest.fn().mockResolvedValue(application),
        update: jest.fn().mockResolvedValue({ ...application, isActive: false }),
      },
    } as unknown as DatabaseService;
    const service = new ApplicationsService(
      databaseService,
      {} as NotificationsService,
      {} as AIServiceClient,
      {} as ApplicationStatusGateway,
    );

    await service.remove(application.id, application.userId, 'PARTICIPANT');

    expect(databaseService.application.update).toHaveBeenCalledWith({
      where: { id: application.id },
      data: { isActive: false },
    });
  });

  describe('ApplicationsService real-time status notifications', () => {
    it('pushes admin status decisions to the participant over WebSocket', async () => {
      const currentApplication = {
        id: 'application-1',
        userId: 'participant-1',
        status: 'UNDER_REVIEW',
        user: { name: 'Participant' },
      };
      const notification = { id: 'notification-1', title: 'Application Accepted' };
      const databaseService = {
        application: {
          findUnique: jest.fn().mockResolvedValue(currentApplication),
          update: jest.fn().mockResolvedValue({ ...currentApplication, status: 'ACCEPTED' }),
        },
      } as unknown as DatabaseService;
      const notificationsService = {
        createApplicationStatusNotification: jest.fn().mockResolvedValue(notification),
      } as unknown as NotificationsService;
      const applicationStatusGateway = {
        sendNotification: jest.fn(),
        sendApplicationStatusUpdate: jest.fn(),
      } as unknown as ApplicationStatusGateway;
      const service = new ApplicationsService(
        databaseService,
        notificationsService,
        {} as AIServiceClient,
        applicationStatusGateway,
      );

      await service.updateStatus('application-1', 'ACCEPTED', 'admin-1');

      expect(notificationsService.createApplicationStatusNotification).toHaveBeenCalledWith(
        'application-1',
        'participant-1',
        'ACCEPTED',
        'admin-1',
      );
      expect(applicationStatusGateway.sendNotification).toHaveBeenCalledWith(
        'participant-1',
        notification,
      );
      expect(applicationStatusGateway.sendApplicationStatusUpdate).toHaveBeenCalledWith(
        'participant-1',
        'application-1',
        'ACCEPTED',
      );
    });
  });
});
