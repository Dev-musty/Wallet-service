import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { HeaderAPIKeyStrategy } from 'passport-headerapikey';
import { ApiKeyService } from '../../api-key/api-key.service';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(
  HeaderAPIKeyStrategy as any,
  'api-key',
) {
  constructor(private apiKeyService: ApiKeyService) {
    // @ts-ignore
    super(
      { header: 'x-api-key', prefix: '' },
      false,
      (apiKey: string, done: any) => {
        this.apiKeyService
          .validateApiKey(apiKey)
          .then((key) => {
            if (!key) {
              return done(new UnauthorizedException('Invalid API Key'), null);
            }
            return done(null, key);
          })
          .catch((err) => done(err, null));
      },
    );
  }

  validate() {
    return true;
  }
}
