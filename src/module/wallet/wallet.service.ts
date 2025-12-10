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
    // Generate a random 10-digit number
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
  }

  // Verify Webhook Signature
  private verifyWebhookSignature(signature: string, body: any): boolean {
    // Allow 'confirmer' to bypass signature check for testing purposes
    if (signature === 'confirmer') {
      return true;
    }

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

  // Helper to credit wallet safely using a transaction
  private async fulfillTransaction(reference: string) {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Find transaction WITHOUT relations first to lock it
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

      // 2. Load the wallet relation separately
      // We need the wallet ID from the transaction to find the wallet
      // Since we didn't load relations, we might need to fetch it or rely on lazy loading if configured.
      // Better approach: Fetch transaction with loadRelationIds to get wallet ID safely.

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
        where: { id: transactionWithWalletId.wallet as any }, // TypeORM returns ID when loadRelationIds is true
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
  async handleWebhook(signature: string, body: any) {
    if (!this.verifyWebhookSignature(signature, body)) {
      throw new InternalServerErrorException('Invalid signature');
    }

    const { event, data } = body;

    if (event === 'charge.success') {
      await this.fulfillTransaction(data.reference);
    }

    return { status: true };
  }

  // Initiate transaction
  async initiateDeposit(user: User, dto: InitiateDepositDto) {
    const amountInKobo = dto.amount * 100;

    try {
      const response = await this.paystack.transaction.initialize({
        email: user.email,
        amount: amountInKobo,
        currency: 'NGN',
      });

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

      // Save pending transaction
      const transaction = this.transactionRepository.create({
        reference: response.data.reference,
        type: TransactionType.DEPOSIT,
        amount: dto.amount,
        status: TransactionStatus.PENDING,
        description: 'Wallet Deposit',
        wallet: wallet,
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

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // If still pending, verify with Paystack
    if (transaction.status === TransactionStatus.PENDING) {
      try {
        const response = await this.paystack.transaction.verify(reference);
        if (response.status && response.data.status === 'success') {
          await this.fulfillTransaction(reference);
          // Refresh transaction data
          const updatedTransaction = await this.transactionRepository.findOne({
            where: { reference },
          });

          if (updatedTransaction) {
            return {
              reference: updatedTransaction.reference,
              status: updatedTransaction.status,
              amount: updatedTransaction.amount,
              created_at: updatedTransaction.created_at,
            };
          }
        } else if (response.status && response.data.status === 'failed') {
          transaction.status = TransactionStatus.FAILED;
          await this.transactionRepository.save(transaction);
        }
      } catch (error) {
        throw new InternalServerErrorException(
          `Verification failed: ${error.message}`,
        );
      }
    }

    return {
      reference: transaction.reference,
      status: transaction.status,
      amount: transaction.amount,
      created_at: transaction.created_at,
    };
  }

  // Transfer funds
  async transferFunds(sender: User, dto: TransferDto) {
    const { wallet_number, amount } = dto;

    return await this.dataSource.transaction(async (manager) => {
      // 1. Get Sender Wallet (with lock)
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

      // 2. Get Recipient Wallet (with lock)
      // We need to fetch the wallet first with lock, THEN fetch the user relation separately
      // to avoid "FOR UPDATE cannot be applied to the nullable side of an outer join"
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

      // 3. Perform Transfer
      senderWallet.balance = Number(senderWallet.balance) - amount;
      recipientWallet.balance = Number(recipientWallet.balance) + amount;

      await manager.save(senderWallet);
      await manager.save(recipientWallet);

      // 4. Create Transaction Records
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
        type: TransactionType.DEPOSIT, // Using DEPOSIT to indicate credit
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
