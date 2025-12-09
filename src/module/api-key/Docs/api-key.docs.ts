import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateApiKeyDto } from '../dto/create-api-key.dto';
import { RolloverApiKeyDto } from '../dto/rollover-api-key.dto';

export function CreateApiKeyDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a new API Key',
      description:
        'Generates a new API key with specified permissions and expiry. The key is returned only once.',
    }),
    ApiBody({ type: CreateApiKeyDto }),
    ApiResponse({
      status: 201,
      description: 'API Key created successfully.',
      schema: {
        example: {
          name: 'Checkout Service',
          permissions: ['deposit', 'read'],
          expires_at: '2025-12-31T23:59:59.999Z',
          key: 'sk_live_EXAMPLE_KEY_987654321',
          user: { id: 1 },
          is_active: true,
          id: 1,
          created_at: '2024-01-01T00:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Maximum of 5 active API keys allowed.',
    }),
  );
}

export function RolloverApiKeyDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Rollover an expired API Key',
      description:
        'Deactivates an expired key and creates a new one with the same permissions.',
    }),
    ApiBody({ type: RolloverApiKeyDto }),
    ApiResponse({
      status: 201,
      description: 'API Key rolled over successfully.',
      schema: {
        example: {
          name: 'Checkout Service (Rollover)',
          permissions: ['deposit', 'read'],
          expires_at: '2026-01-31T23:59:59.999Z',
          key: '...._live_.......',
          user: { id: 1 },
          is_active: true,
          id: 2,
          created_at: '2025-01-01T00:00:00.000Z',
        },
      },
    }),
    ApiResponse({ status: 404, description: 'API Key not found.' }),
    ApiResponse({ status: 400, description: 'API Key is not yet expired.' }),
  );
}
