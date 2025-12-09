import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import env from './config/config';
import { validate } from './config/env-validator';
import { TypeOrmModule } from '@nestjs/typeorm';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [env],
      validate,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: configService.get<string>('db_type') as 'postgres',
        host: configService.get<string>('db_host'),
        port: configService.get<number>('db_port'),
        username: configService.get<string>('db_user'),
        password: configService.get<string>('db_pass'),
        database: configService.get<string>('db_name'),
        autoLoadEntities: true,
        synchronize: false,
        ssl: configService.get<boolean>('db_ssl')
          ? { rejectUnauthorized: false }
          : false,
      }),
    }),
  ],
})
export class CommonModule {}
