import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import { OAuthProfile, JwtPayload } from './interfaces/auth.interface';
import { CreateUserDto, LoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private databaseService: DatabaseService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const existingUser = await this.databaseService.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const name = createUserDto.name || `${createUserDto.firstName} ${createUserDto.lastName}`;

    const user = await this.databaseService.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        name,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
      },
    });

    return this.login(user);
  }

  async loginWithPassword(loginDto: LoginDto) {
    const user = await this.databaseService.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.login(user);
  }

  async validateOAuthUser(profile: OAuthProfile) {
    try {
      console.log('Validating OAuth user:', profile);
      
      let user = await this.databaseService.user.findUnique({
        where: {
          email: profile.email,
        },
      });

      if (!user) {
        console.log('Creating new user for OAuth');
        user = await this.databaseService.user.create({
          data: {
            email: profile.email,
            name: profile.name || 'Unknown User',
            firstName: profile.firstName || null,
            lastName: profile.lastName || null,
            avatar: profile.avatar,
            provider: profile.provider,
            providerId: profile.providerId,
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
