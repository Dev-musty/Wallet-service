# Wallet Service

A backend wallet service that allows users to deposit money using Paystack, manage wallet balances, view transaction history, and transfer funds to other users. It supports authentication via Google Sign-In (JWT) and a robust API Key system for service-to-service access.

## Features

- **Authentication**: Google Sign-In (JWT) for users.
- **Wallet Management**:
  - Wallet creation per user.
  - Deposits via Paystack.
  - Wallet-to-wallet transfers.
  - Balance and transaction history checks.
- **API Key System**:
  - Generate API keys for service access.
  - Permission-based access (`deposit`, `transfer`, `read`).
  - Key expiration (`1H`, `1D`, `1M`, `1Y`) and rollover.
  - Limit of 5 active keys per user.
- **Payments**:
  - Paystack integration for deposits.
  - Mandatory Webhook handling for transaction verification.

## Tech Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Payment Gateway**: Paystack

## Environment Variables

Create a `.env` file in the root directory with the following variables:


## API Endpoints

### Authentication
- **GET** `/auth/google`: Trigger Google Sign-In.
- **GET** `/auth/google/callback`: Handle callback and return JWT.

### API Keys
- **POST** `/keys/create`: Create a new API key.
  - Body: `{ "name": "service-name", "permissions": ["deposit", "read"], "expiry": "1D" }`
  - Expiry options: `1H`, `1D`, `1M`, `1Y`.
- **POST** `/keys/rollover`: Rollover an expired key.
  - Body: `{ "expired_key_id": "...", "expiry": "1M" }`

### Wallet
- **POST** `/wallet/deposit`: Initialize a Paystack deposit.
  - Body: `{ "amount": 5000 }`
- **POST** `/wallet/paystack/webhook`: Handle Paystack webhooks (updates balance).
- **GET** `/wallet/deposit/{reference}/status`: Check deposit status (Manual check).
- **GET** `/wallet/balance`: Get current wallet balance.
- **POST** `/wallet/transfer`: Transfer funds to another wallet.
  - Body: `{ "wallet_number": "...", "amount": 3000 }`
- **GET** `/wallet/transactions`: View transaction history.

## Access Control

- **JWT**: Users authenticated via Google can perform all wallet actions.
- **API Keys**: Services using `x-api-key` header are restricted by their assigned permissions and expiry status.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```
