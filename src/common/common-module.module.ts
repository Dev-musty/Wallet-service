import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import env from './config/config';
import { validate } from './config/env-validator';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [env],
      validate,
    }),
  ],
})
export class CommonModuleModule {}
