import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID') || 'disabled-google-client-id',
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET') || 'disabled-google-client-secret',
      callbackURL: '/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;
    const user = {
      providerId: id,
      provider: 'google',
      email: emails[0].value,
      name: `${name.givenName} ${name.familyName}`,
      avatar: photos[0].value,
    };
    done(null, user);
  }
}
