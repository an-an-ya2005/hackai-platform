import { Controller, Get, UseGuards, Query, Param, Patch, Body, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { UserResponseDto } from './dto/user-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async getCurrentUser(@CurrentUser() user: any) {
    const userData = await this.usersService.findById(user.id);
    if (!userData) {
      throw new UnauthorizedException('User not found. Please sign in again.');
    }
    return new UserResponseDto(userData);
  }

  @Get()
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async getAllUsers(@Query() paginationDto: PaginationDto) {
    const result = await this.usersService.getAllUsers(
      paginationDto.page,
      paginationDto.limit,
    );
    
    return {
      ...result,
      users: result.users.map(user => new UserResponseDto(user)),
    };
  }

  @Patch(':id/role')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async updateUserRole(
    @Param('id') id: string,
    @Body('role') role: string,
  ) {
    const user = await this.usersService.updateUserRole(id, role);
    return new UserResponseDto(user);
  }
}
