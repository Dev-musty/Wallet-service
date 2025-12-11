import { Controller, Get, Req, UseGuards, Body, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { GoogleAuthDocs, GoogleCallbackDocs } from './Docs/auth.docs';
import { RefreshTokenDto } from './Dtos/refresh-token.dto';
import { RefreshTokenDocs } from './Docs/refresh-token.docs';

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @GoogleAuthDocs()
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @GoogleCallbackDocs()
  async googleAuthRedirect(@Req() req) {
    return this.authService.login(req.user);
  }

  @Post('refresh-token')
  @RefreshTokenDocs()
  async refreshToken(@Body() dto: RefreshTokenDto) {
    // For demo, assume userId is in the refresh token payload
    // In production, decode and validate the refresh token
    const decoded: any = this.authService['jwtService'].decode(
      dto.refresh_token,
    );
    if (!decoded || !decoded.sub) {
      return { error: 'Invalid refresh token' };
    }
    return this.authService.refreshToken(decoded.sub, dto.refresh_token);
  }
}
