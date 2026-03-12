import { Controller, Get, Post, Body, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto, LoginDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.loginWithPassword(loginDto);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req, @Res() res) {
    const user = await this.authService.validateOAuthUser(req.user);
    const tokens = await this.authService.login(user);
    
    // Redirect to frontend with token
    const frontendUrl = this.configService.get('FRONTEND_URL');
    res.redirect(`${frontendUrl}/auth/callback?token=${tokens.access_token}`);
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth() {
    // Initiates GitHub OAuth flow
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthCallback(@Req() req, @Res() res) {
    try {
      console.log('GitHub callback received:', req.user);
      const user = await this.authService.validateOAuthUser(req.user);
      console.log('User validated:', user);
      const tokens = await this.authService.login(user);
      console.log('Tokens generated:', { access_token: '***' });
      
      // Redirect to frontend with token
      const frontendUrl = this.configService.get('FRONTEND_URL');
      res.redirect(`${frontendUrl}/auth/callback?token=${tokens.access_token}`);
    } catch (error) {
      console.error('GitHub OAuth callback error:', error);
      const frontendUrl = this.configService.get('FRONTEND_URL');
      res.redirect(`${frontendUrl}/auth/signin?error=oauth_failed`);
    }
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req) {
    return req.user;
  }
}
