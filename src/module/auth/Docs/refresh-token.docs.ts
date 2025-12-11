import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { RefreshTokenDto } from '../Dtos/refresh-token.dto';

export function RefreshTokenDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Refresh JWT Token',
      description: 'Exchange a valid refresh token for a new access token.'
    }),
    ApiBody({ type: RefreshTokenDto }),
    ApiResponse({
      status: 200,
      description: 'Access token refreshed successfully.',
      schema: {
        example: {
          access_token: 'new.jwt.token',
          refresh_token: 'new.refresh.token'
        }
      }
    }),
    ApiResponse({ status: 401, description: 'Invalid or expired refresh token.' })
  );
}
