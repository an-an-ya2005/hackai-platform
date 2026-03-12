import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateNotificationDto, UpdateNotificationDto, NotificationQueryDto } from './dto/notification.dto';
import { NotificationType, Notification, Prisma } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private readonly db: DatabaseService) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    return this.db.notification.create({
      data: createNotificationDto,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(userId: string, query: NotificationQueryDto): Promise<{
    notifications: Notification[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { read, type, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(read !== undefined && { read }),
      ...(type && { type }),
    };

    const [notifications, total] = await Promise.all([
      this.db.notification.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.db.notification.count({ where }),
    ]);

    return {
      notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userId: string): Promise<Notification | null> {
    return this.db.notification.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async update(id: string, userId: string, updateNotificationDto: UpdateNotificationDto): Promise<Notification> {
    return this.db.notification.update({
      where: {
        id,
        userId,
      },
      data: updateNotificationDto,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    return this.update(id, userId, { read: true });
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await this.db.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return { count: result.count };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.db.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  }

  async remove(id: string, userId: string): Promise<Notification> {
    return this.db.notification.delete({
      where: {
        id,
        userId,
      },
    });
  }

  // Helper methods for creating specific notification types
  async createApplicationStatusNotification(
    applicationId: string,
    userId: string,
    newStatus: string,
    senderId?: string,
  ): Promise<Notification> {
    const statusMessages = {
      DRAFT: 'Your application has been saved as a draft.',
      SUBMITTED: '🎉 Your application has been submitted successfully! Our team will review it shortly.',
      UNDER_REVIEW: '👀 Your application is now under review by our evaluation team.',
      ACCEPTED: '🎉 Congratulations! Your application has been accepted! Welcome to the Hack-Ai thon!',
      REJECTED: '❌ Your application has been rejected. Please check the feedback and feel free to reapply.',
    };

    const statusTitles = {
      DRAFT: 'Application Saved',
      SUBMITTED: 'Application Submitted',
      UNDER_REVIEW: 'Application Under Review',
      ACCEPTED: 'Application Accepted',
      REJECTED: 'Application Rejected',
    };

    return this.create({
      type: NotificationType.APPLICATION_STATUS_CHANGE,
      title: statusTitles[newStatus] || `Application Status Updated`,
      message: statusMessages[newStatus] || `Your application status has been changed to ${newStatus}`,
      userId,
      senderId,
      actionUrl: `/applications/${applicationId}`,
      metadata: {
        applicationId,
        newStatus,
        timestamp: new Date().toISOString(),
      },
    });
  }

  async createNewApplicationNotification(
    applicationTitle: string,
    applicantName: string,
    applicationId: string,
    adminUserId: string,
  ): Promise<Notification> {
    return this.create({
      type: NotificationType.NEW_APPLICATION_SUBMITTED,
      title: '📋 New Application Submitted',
      message: `${applicantName} has submitted a new application: "${applicationTitle}". Please review it when possible.`,
      userId: adminUserId,
      actionUrl: `/admin/applications/${applicationId}`,
      metadata: {
        applicationId,
        applicantName,
        applicationTitle,
        submissionTime: new Date().toISOString(),
      },
    });
  }

  async createSystemAnnouncement(
    title: string,
    message: string,
    userIds: string[],
    senderId?: string,
    actionUrl?: string,
  ): Promise<Notification[]> {
    const notifications = await Promise.all(
      userIds.map(userId =>
        this.create({
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          title,
          message,
          userId,
          senderId,
          actionUrl,
        }),
      ),
    );

    return notifications;
  }

  async createDeadlineReminder(
    title: string,
    message: string,
    userIds: string[],
    actionUrl?: string,
  ): Promise<Notification[]> {
    const notifications = await Promise.all(
      userIds.map(userId =>
        this.create({
          type: NotificationType.DEADLINE_REMINDER,
          title,
          message,
          userId,
          actionUrl,
        }),
      ),
    );

    return notifications;
  }
}
