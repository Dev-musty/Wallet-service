import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Paystack from '@paystack/paystack-sdk';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from './Entity/transaction.entity';
import { Wallet } from './Entity/wallet.entity';
import { User } from '../user/Entity/user.entity';
import { InitiateDepositDto } from './Dto/initiate-deposit.dto';
import { TransferDto } from './Dto/transfer.dto';

import * as crypto from 'crypto';
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */

// Define what the Paystack body looks like
interface PaystackWebhookBody {
  event: string;
  data: {
    reference: string;
    status: string;
    gateway_response?: string;
    amount?: number;
    [key: string]: any; // Allow other extra properties safely
  };
}
interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}
@Injectable()
export class WalletService {
  paystack: any;
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    private dataSource: DataSource,
  ) {
    this.paystack = new Paystack(
      this.configService.get<string>('paystack_key'),
    );
  }

  // Create Wallet for new user
  async createWallet(user: User): Promise<Wallet> {
    const walletNumber = this.generateWalletNumber();
    const wallet = this.walletRepository.create({
      user: user,
      wallet_number: walletNumber,
      balance: 0,
    });
    return await this.walletRepository.save(wallet);
  }

  private generateWalletNumber(): string {
    // Generate a random 10-digit number for wallet
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
  }

  // Verify Webhook Signature
  private verifyWebhookSignature(signature: string, body: any): boolean {
    // const sig = this.configService.get<string>('sig_secret');
    // if (signature === sig) {
    //   return true;
    // }

    const secret = this.configService.get<string>('paystack_key');
    if (!secret) {
      throw new InternalServerErrorException(
        'Paystack secret key is missing in configuration',
      );
    }
    const hash = crypto
      .createHmac('sha512', secret)
      .update(JSON.stringify(body))
      .digest('hex');
    return hash === signature;
  }

  // credit wallet using a transaction
  private async fulfillTransaction(reference: string) {
    return await this.dataSource.transaction(async (manager) => {
      const transaction = await manager.findOne(Transaction, {
        where: { reference },
        lock: { mode: 'pessimistic_write' },
      });

      if (!transaction) {
        return { message: 'Transaction not found' };
      }

      if (transaction.status === TransactionStatus.SUCCESS) {
        return { message: 'Transaction already processed' };
      }

      const transactionWithWalletId = await manager.findOne(Transaction, {
        where: { id: transaction.id },
        loadRelationIds: { relations: ['wallet'] },
      });

      if (!transactionWithWalletId) {
        throw new InternalServerErrorException(
          'Transaction not found during processing',
        );
      }

      // Update transaction status
      transaction.status = TransactionStatus.SUCCESS;
      await manager.save(transaction);

      // Credit wallet
      // Now we use the wallet ID we found
      const wallet = await manager.findOne(Wallet, {
        where: { id: transactionWithWalletId.wallet as any },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        throw new InternalServerErrorException('Wallet not found');
      }

      wallet.balance = Number(wallet.balance) + Number(transaction.amount);
      await manager.save(wallet);

      return { message: 'Wallet credited successfully' };
    });
  }

  // Handle Webhook
  async handleWebhook(signature: string, body: PaystackWebhookBody) {
    if (!this.verifyWebhookSignature(signature, body)) {
      throw new InternalServerErrorException('Invalid signature');
    }

    const { event, data } = body;
    const reference = data.reference;
    if (event === 'charge.success') {
      if (data.status === 'success') {
        await this.fulfillTransaction(reference);
      } else if (data.status === 'failed') {
        const reason = data.gateway_response || 'Transaction failed';
        await this.markTransactionFailed(data.reference, reason);
      }
    }

    return { status: true };
  }
  // failed transaction
  private async markTransactionFailed(reference: string, reason: string) {
    const transaction = await this.transactionRepository.findOne({
      where: { reference },
    });

    // If found and technically still pending, mark as failed
    if (transaction && transaction.status === TransactionStatus.PENDING) {
      transaction.status = TransactionStatus.FAILED;
      transaction.description = `Failed: ${reason}`;
      await this.transactionRepository.save(transaction);
      console.log(
        `Transaction ${reference} marked as FAILED. Reason: ${reason}`,
      );
    }
  }

  // Initiate transaction
  async initiateDeposit(
    user: User,
    dto: InitiateDepositDto,
    idempotencyKey?: string,
  ) {
    const amountInKobo = dto.amount * 100;

    try {
      // If an idempotency key is provided, return existing initialization if present
      if (idempotencyKey) {
        const existing = await this.transactionRepository.findOne({
          where: { idempotency_key: idempotencyKey },
        });
        if (existing) {
          return {
            message: 'Transaction already existing',
            reference: existing.reference,
            authorization_url: existing.auth_url,
          };
        }
      }

      const response = (await this.paystack.transaction.initialize({
        email: user.email,
        amount: amountInKobo,
        currency: 'NGN',
      })) as PaystackInitResponse;
      if (!response.status) {
        throw new InternalServerErrorException(
          'Paystack initialization failed',
        );
      }

      // Find user's wallet
      let wallet = await this.walletRepository.findOne({
        where: { user: { id: user.id } },
      });

      if (!wallet) {
        wallet = await this.createWallet(user);
      }

      // Save pending transaction (include idempotency key + auth URL)
      const transaction = this.transactionRepository.create({
        reference: response.data.reference,
        type: TransactionType.DEPOSIT,
        amount: dto.amount,
        status: TransactionStatus.PENDING,
        description: 'Wallet Deposit',
        wallet: wallet,
        idempotency_key: idempotencyKey ?? undefined,
        auth_url: response.data?.authorization_url ?? undefined,
      });

      await this.transactionRepository.save(transaction);

      return response.data;
    } catch (error) {
      throw new InternalServerErrorException(
        `Deposit initiation failed: ${error.message}`,
      );
    }
  }

  // Check deposit status
  async checkDepositStatus(reference: string) {
    const transaction = await this.transactionRepository.findOne({
      where: { reference },
    });
    console.log(transaction?.reference);
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (
      transaction.status === TransactionStatus.SUCCESS ||
      transaction.status === TransactionStatus.FAILED
    ) {
      return {
        reference: transaction.reference,
        status: transaction.status,
        amount: transaction.amount,
        created_at: transaction.created_at,
      };
    }

    try {
      const response = await this.paystack.transaction.verify(reference);
      const paystackStatus = response.data.status;
      // Update DB if Paystack says it's done but our DB didn't know yet
      if (paystackStatus === 'success') {
        transaction.status = TransactionStatus.SUCCESS;
        await this.transactionRepository.save(transaction);
      } else if (
        paystackStatus === 'failed' ||
        paystackStatus === 'abandoned'
      ) {
        transaction.status = TransactionStatus.FAILED;
        await this.transactionRepository.save(transaction);
      }

      return {
        reference: transaction.reference,
        status: paystackStatus,
        amount: transaction.amount,
        created_at: transaction.created_at,
      };
    } catch (error) {
      console.error(`Paystack verification check failed: ${error.message}`);
      return {
        reference: transaction.reference,
        status: transaction.status, // Return 'PENDING'
        amount: transaction.amount,
        created_at: transaction.created_at,
      };
    }
  }

  // Transfer funds
  async transferFunds(sender: User, dto: TransferDto) {
    const { wallet_number, amount } = dto;

    return await this.dataSource.transaction(async (manager) => {
      const senderWallet = await manager.findOne(Wallet, {
        where: { user: { id: sender.id } },
        lock: { mode: 'pessimistic_write' },
      });

      if (!senderWallet) {
        throw new NotFoundException('Sender wallet not found');
      }

      if (senderWallet.wallet_number === wallet_number) {
        throw new BadRequestException('Cannot transfer to yourself');
      }

      if (Number(senderWallet.balance) < amount) {
        throw new BadRequestException('Insufficient funds');
      }
      const recipientWallet = await manager.findOne(Wallet, {
        where: { wallet_number },
        lock: { mode: 'pessimistic_write' },
      });

      if (!recipientWallet) {
        throw new NotFoundException('Recipient wallet not found');
      }

      // Fetch recipient user details for the description
      const recipientWalletWithUser = await manager.findOne(Wallet, {
        where: { id: recipientWallet.id },
        relations: ['user'],
      });

      if (!recipientWalletWithUser || !recipientWalletWithUser.user) {
        throw new InternalServerErrorException('Recipient user not found');
      }

      // Transfer
      senderWallet.balance = Number(senderWallet.balance) - amount;
      recipientWallet.balance = Number(recipientWallet.balance) + amount;

      await manager.save(senderWallet);
      await manager.save(recipientWallet);

      // Transaction Records
      const debitTransaction = manager.create(Transaction, {
        reference: `TRF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: TransactionType.TRANSFER,
        amount: amount,
        status: TransactionStatus.SUCCESS,
        description: `Transfer to ${recipientWalletWithUser.user.email}`,
        wallet: senderWallet,
      });

      const creditTransaction = manager.create(Transaction, {
        reference: `RCV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: TransactionType.DEPOSIT,
        amount: amount,
        status: TransactionStatus.SUCCESS,
        description: `Transfer from ${sender.email}`,
        wallet: recipientWallet,
      });

      await manager.save(debitTransaction);
      await manager.save(creditTransaction);

      return {
        message: 'Transfer successful',
        reference: debitTransaction.reference,
        amount: amount,
        recipient: recipientWalletWithUser.user.email,
      };
    });
  }

  // Get Wallet Balance
  async getWalletBalance(user: User) {
    const wallet = await this.walletRepository.findOne({
      where: { user: { id: user.id } },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return {
      balance: wallet.balance,
      currency: wallet.currency,
      wallet_number: wallet.wallet_number,
    };
  }

  // Get Transaction History
  async getTransactionHistory(user: User) {
    const wallet = await this.walletRepository.findOne({
      where: { user: { id: user.id } },
      relations: ['transactions'],
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet.transactions.sort(
      (a, b) => b.created_at.getTime() - a.created_at.getTime(),
    );
  }
}
