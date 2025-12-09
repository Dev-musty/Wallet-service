import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function GoogleAuthDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Google Sign-In',
      description: 'Redirects to Google for authentication.',
    }),
    ApiResponse({
      status: 302,
      description: 'Redirects to Google login page.',
    }),
  );
}

export function GoogleCallbackDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Google Sign-In Callback',
      description: 'Handles the callback from Google and returns a JWT.',
    }),
    ApiResponse({
      status: 200,
      description: 'Returns a JWT access token.',
      schema: {
        example: {
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    }),
  );
}
