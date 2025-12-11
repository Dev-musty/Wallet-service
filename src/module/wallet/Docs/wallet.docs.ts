import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiSecurity,
  ApiParam,
  ApiHeader,
} from '@nestjs/swagger';
import { InitiateDepositDto } from '../Dto/initiate-deposit.dto';
import { TransferDto } from '../Dto/transfer.dto';

export function HandleWebhookDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Paystack Webhook',
      description:
        'Receives transaction updates from Paystack. Credits wallet only after webhook confirms success. Validates Paystack signature.',
    }),
    ApiHeader({
      name: 'x-paystack-signature',
      description:
        'HMAC SHA512 signature of the request body. Use "confirmer" to bypass verification for testing.',
      required: true,
      schema: {
        default: '',
      },
    }),
    // ApiBody({
    //   schema: {
    //     type: 'object',
    //     example: {
    //       event: 'charge.success',
    //       data: {
    //         reference: 'wsbn0rdgyw',
    //       },
    //     },
    //   },
    //   description: 'Paystack event payload',
    // }),
    ApiResponse({
      status: 200,
      description: 'Webhook processed successfully.',
      schema: {
        example: {
          status: true,
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Invalid signature or internal error.',
    }),
  );
}

export function InitiateDepositDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Initiate a deposit via Paystack',
      description:
        'Initializes a transaction with Paystack and returns the authorization URL. Accessible by JWT users and API Keys with "deposit" permission.',
    }),
    ApiHeader({
      name: 'Idempotency-Key',
      description:
        'Optional UUID to make the initialization idempotent. If you retry the request with the same key the server will return the original initialization response instead of creating a new transaction.',
      required: false,
    }),
    ApiSecurity('x-api-key'),
    ApiBody({ type: InitiateDepositDto }),
    ApiResponse({
      status: 201,
      description: 'Deposit initiated successfully.',
      schema: {
        example: {
          authorization_url: 'https://checkout.paystack.com/access_code',
          access_code: 'access_code',
          reference: 'reference',
          idempotency_key: 'a1b2c3d4-...-uuid',
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Paystack initialization failed.',
    }),
  );
}

export function CheckDepositStatusDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Check deposit status',
      description:
        'Manually checks the status of a deposit transaction. Accessible by JWT users and API Keys with "read" permission.',
    }),
    ApiSecurity('x-api-key'),
    ApiParam({ name: 'reference', description: 'Transaction reference' }),
    ApiResponse({
      status: 200,
      description: 'Transaction status retrieved successfully.',
      schema: {
        example: {
          reference: 'TRX-123456',
          status: 'success',
          amount: 5000,
          created_at: '2023-10-27T10:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Transaction not found.',
    }),
  );
}

export function TransferDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Transfer funds to another user',
      description:
        'Transfers funds from the authenticated user/wallet to another wallet using the wallet number (Paystack Customer Code). Accessible by JWT users and API Keys with "transfer" permission.',
    }),
    ApiSecurity('x-api-key'),
    ApiBody({ type: TransferDto }),
    ApiResponse({
      status: 201,
      description: 'Transfer successful.',
      schema: {
        example: {
          message: 'Transfer successful',
          reference: 'TRF-1698400000000-123',
          amount: 3000,
          recipient: 'recipient@example.com',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Insufficient funds or self-transfer attempt.',
    }),
    ApiResponse({
      status: 404,
      description: 'Sender or Recipient wallet not found.',
    }),
  );
}

export function GetBalanceDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get wallet balance',
      description:
        'Retrieves the current balance of the authenticated user\'s wallet. Accessible by JWT users and API Keys with "read" permission.',
    }),
    ApiSecurity('x-api-key'),
    ApiResponse({
      status: 200,
      description: 'Balance retrieved successfully.',
      schema: {
        example: {
          balance: 15000.5,
          currency: 'NGN',
          wallet_number: 'CUS_8h2710dc',
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Wallet not found.',
    }),
  );
}

export function GetTransactionHistoryDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get transaction history',
      description:
        'Retrieves the transaction history for the authenticated user\'s wallet. Accessible by JWT users and API Keys with "read" permission.',
    }),
    ApiSecurity('x-api-key'),
    ApiResponse({
      status: 200,
      description: 'Transaction history retrieved successfully.',
      schema: {
        example: [
          {
            id: 'uuid',
            reference: 'TRF-1698400000000-123',
            type: 'transfer',
            amount: 3000,
            status: 'success',
            description: 'Transfer to recipient@example.com',
            created_at: '2023-10-27T10:00:00.000Z',
          },
        ],
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Wallet not found.',
    }),
  );
}
