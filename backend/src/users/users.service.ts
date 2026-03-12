import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UsersService {
  constructor(private databaseService: DatabaseService) {}

  async findById(id: string) {
    return this.databaseService.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string) {
    return this.databaseService.user.findUnique({
      where: { email },
    });
  }

  async getAllUsers(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      this.databaseService.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.databaseService.user.count(),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateUserRole(id: string, role: string) {
    return this.databaseService.user.update({
      where: { id },
      data: { role: role as any },
    });
  }
}
