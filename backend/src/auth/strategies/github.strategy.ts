import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get('GITHUB_CLIENT_ID') || 'disabled-github-client-id',
      clientSecret: configService.get('GITHUB_CLIENT_SECRET') || 'disabled-github-client-secret',
      callbackURL: '/api/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ): Promise<any> {
    const { id, username, emails, photos, displayName } = profile;
    const fullName = displayName || profile.name || username || 'GitHub User';
    
    // Parse first and last name from full name
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    
    const user = {
      providerId: id,
      provider: 'github',
      email: emails?.[0]?.value || `${username}@github.local`,
      name: fullName,
      firstName: firstName || null,
      lastName: lastName || null,
      avatar: photos?.[0]?.value,
    };
    done(null, user);
  }
}
