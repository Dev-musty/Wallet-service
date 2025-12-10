import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Headers,
  HttpCode,
  Get,
  Param,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InitiateDepositDto } from './Dto/initiate-deposit.dto';
import { TransferDto } from './Dto/transfer.dto';
import { PermissionsGuard } from '../auth/Guard/permissions.guard';
import { Permissions } from '../auth/Decorator/permissions.decorator';
import {
  InitiateDepositDocs,
  CheckDepositStatusDocs,
  TransferDocs,
  GetBalanceDocs,
  GetTransactionHistoryDocs,
  HandleWebhookDocs,
} from './Docs/wallet.docs';

import { CompositeAuthGuard } from '../auth/Guard/composite.guard';

@ApiTags('Wallet')
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('paystack/webhook')
  @HttpCode(200)
  @HandleWebhookDocs()
  async handleWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Body() body: any,
  ) {
    return this.walletService.handleWebhook(signature, body);
  }

  @Post('deposit')
  @ApiBearerAuth()
  @UseGuards(CompositeAuthGuard, PermissionsGuard)
  @Permissions('deposit')
  @InitiateDepositDocs()
  async initiateDeposit(@Req() req, @Body() dto: InitiateDepositDto) {
    const user = req.user.user ? req.user.user : req.user;
    return this.walletService.initiateDeposit(user, dto);
  }

  @Get('deposit/:reference/status')
  @ApiBearerAuth()
  @UseGuards(CompositeAuthGuard, PermissionsGuard)
  @Permissions('read')
  @CheckDepositStatusDocs()
  async checkDepositStatus(@Param('reference') reference: string) {
    return this.walletService.checkDepositStatus(reference);
  }

  @Post('transfer')
  @ApiBearerAuth()
  @UseGuards(CompositeAuthGuard, PermissionsGuard)
  @Permissions('transfer')
  @TransferDocs()
  async transferFunds(@Req() req, @Body() dto: TransferDto) {
    const user = req.user.user ? req.user.user : req.user;
    return this.walletService.transferFunds(user, dto);
  }

  @Get('balance')
  @ApiBearerAuth()
  @UseGuards(CompositeAuthGuard, PermissionsGuard)
  @Permissions('read')
  @GetBalanceDocs()
  async getWalletBalance(@Req() req) {
    const user = req.user.user ? req.user.user : req.user;
    return this.walletService.getWalletBalance(user);
  }

  @Get('transactions')
  @ApiBearerAuth()
  @UseGuards(CompositeAuthGuard, PermissionsGuard)
  @Permissions('read')
  @GetTransactionHistoryDocs()
  async getTransactionHistory(@Req() req) {
    const user = req.user.user ? req.user.user : req.user;
    return this.walletService.getTransactionHistory(user);
  }
}
