import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GoogleStrategy } from './Services/google.service';
import { JwtStrategy } from './Services/JWT.service';

import { ApiKeyStrategy } from './Services/api-key.strategy';
import { ApiKeyModule } from '../api-key/api-key.module';
import { WalletModule } from '../wallet/wallet.module';

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
@Module({
  imports: [
    UserModule,
    ApiKeyModule,
    WalletModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt_secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt_expiration') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, JwtStrategy, ApiKeyStrategy],
})
export class AuthModule {}
