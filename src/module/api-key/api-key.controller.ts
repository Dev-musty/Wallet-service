import { Controller, Post, Body, UseGuards, Req, Delete, Param, Get } from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { RolloverApiKeyDto } from './dto/rollover-api-key.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CreateApiKeyDocs, RolloverApiKeyDocs, RevokeApiKeyDocs, ListApiKeysDocs } from './Docs/api-key.docs';

@ApiTags('API Keys')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('keys')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post('create')
  @CreateApiKeyDocs()
  async createApiKey(@Req() req, @Body() dto: CreateApiKeyDto) {
    return this.apiKeyService.createApiKey(req.user, dto);
  }

  @Get()
  @ListApiKeysDocs()
  async listApiKeys(@Req() req) {
    return this.apiKeyService.listApiKeys(req.user);
  }

  @Post('rollover')
  @RolloverApiKeyDocs()
  async rolloverApiKey(@Req() req, @Body() dto: RolloverApiKeyDto) {
    return this.apiKeyService.rolloverApiKey(req.user, dto);
  }

  @Delete(':id')
  @RevokeApiKeyDocs()
  async revokeApiKey(@Req() req, @Param('id') id: string) {
    return this.apiKeyService.revokeApiKey(req.user, id);
  }
}
