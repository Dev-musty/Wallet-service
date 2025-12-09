import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('google_client_id') || '',
      clientSecret: configService.get<string>('google_client_secret') || '',
      callbackURL: configService.get<string>('google_callback_url') || '',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, id } = profile;
    const user = await this.authService.validateOAuthLogin({
      email: emails[0].value,
      fullName: `${name.givenName} ${name.familyName}`,
      googleID: id,
    });
    done(null, user);
  }
}
