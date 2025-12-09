import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './module/user/user.module';
import { CommonModule } from './common/common-module.module';
import { AuthModule } from './module/auth/auth.module';
import { WalletModule } from './module/wallet/wallet.module';
import { ApiKeyModule } from './module/api-key/api-key.module';

@Module({
  imports: [CommonModule, UserModule, AuthModule, WalletModule, ApiKeyModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
