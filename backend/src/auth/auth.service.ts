import { Injectable, UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { OAuthProfile, JwtPayload } from './interfaces/auth.interface';
import { CreateUserDto, LoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private databaseService: DatabaseService,
    private configService: ConfigService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const email = createUserDto.email.trim().toLowerCase();
    const requestedRole = createUserDto.role ?? UserRole.PARTICIPANT;
    if (requestedRole === UserRole.ADMIN) {
      throw new ForbiddenException('Admin accounts must be created by signing in with the configured Google account');
    }

    const existingUser = await this.databaseService.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const name = createUserDto.name || `${createUserDto.firstName} ${createUserDto.lastName}`;

    const user = await this.databaseService.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        role: requestedRole,
      },
    });

    return this.login(user);
  }

  async loginWithPassword(loginDto: LoginDto) {
    const email = loginDto.email.trim().toLowerCase();
    if (loginDto.role === UserRole.ADMIN || this.isConfiguredAdminEmail(email)) {
      throw new UnauthorizedException('Admin accounts must sign in with Google');
    }

    const user = await this.databaseService.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (loginDto.role && loginDto.role !== user.role) {
      throw new UnauthorizedException('This account does not have the selected role');
    }

    return this.login(user);
  }

  async validateOAuthUser(profile: OAuthProfile) {
    try {
      console.log('Validating OAuth user:', profile);
      const roleData = profile.provider === 'google'
        ? { role: this.getGoogleUserRole(profile.email) }
        : {};
      
      let user = await this.databaseService.user.findUnique({
        where: {
          email: profile.email.trim().toLowerCase(),
        },
      });

      if (profile.provider !== 'google' && (user?.role === UserRole.ADMIN || this.isConfiguredAdminEmail(profile.email))) {
        throw new UnauthorizedException('Admin accounts must sign in with Google');
      }

      if (!user) {
        console.log('Creating new user for OAuth');
        user = await this.databaseService.user.create({
          data: {
            email: profile.email.trim().toLowerCase(),
            name: profile.name || 'Unknown User',
            firstName: profile.firstName || null,
            lastName: profile.lastName || null,
            avatar: profile.avatar,
            provider: profile.provider,
            providerId: profile.providerId,
            ...roleData,
          },
        });
      } else if (user.providerId !== profile.providerId) {
        console.log('Updating existing user with OAuth provider info');
        // Update provider info if user exists but with different provider
        user = await this.databaseService.user.update({
          where: { id: user.id },
          data: {
            provider: profile.provider,
            providerId: profile.providerId,
            firstName: profile.firstName || user.firstName,
            lastName: profile.lastName || user.lastName,
            avatar: profile.avatar || user.avatar,
            ...roleData,
            ...(profile.provider === 'google' && this.isConfiguredAdminEmail(profile.email)
              ? { password: null }
              : {}),
          },
        });
      } else {
        console.log('Updating existing user with latest OAuth data');
        // Update user with latest data from OAuth provider
        user = await this.databaseService.user.update({
          where: { id: user.id },
          data: {
            firstName: profile.firstName || user.firstName,
            lastName: profile.lastName || user.lastName,
            avatar: profile.avatar || user.avatar,
            name: profile.name || user.name,
            ...roleData,
            ...(profile.provider === 'google' && this.isConfiguredAdminEmail(profile.email)
              ? { password: null }
              : {}),
          },
        });
      }

      console.log('OAuth user validated successfully:', user.id);
      return user;
    } catch (error) {
      console.error('Error validating OAuth user:', error);
      throw error;
    }
  }

  private getGoogleUserRole(email: string): UserRole {
    return this.isConfiguredAdminEmail(email)
      ? UserRole.ADMIN
      : UserRole.PARTICIPANT;
  }

  private isConfiguredAdminEmail(email: string): boolean {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL')?.trim().toLowerCase();
    return Boolean(adminEmail && email.trim().toLowerCase() === adminEmail);
  }

  async login(user: any) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
    };
  }
}
