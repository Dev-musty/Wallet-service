import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from './Entity/api-key.entity';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { RolloverApiKeyDto } from './dto/rollover-api-key.dto';
import { User } from '../user/Entity/user.entity';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
  ) {}

  private hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  private generateKey(): string {
    return `sk_live_${crypto.randomBytes(24).toString('hex')}`;
  }

  private calculateExpiry(expiryString: string): Date {
    const now = new Date();
    switch (expiryString) {
      case '1H':
        return new Date(now.getTime() + 60 * 60 * 1000);
      case '1D':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case '1M':
        return new Date(now.setMonth(now.getMonth() + 1));
      case '1Y':
        return new Date(now.setFullYear(now.getFullYear() + 1));
      default:
        return new Date(now.setMonth(now.getMonth() + 1)); // Default 1M
    }
  }

  async createApiKey(user: User, dto: CreateApiKeyDto) {
    const activeKeysCount = await this.apiKeyRepository.count({
      where: { user: { id: user.id }, is_active: true },
    });

    if (activeKeysCount >= 5) {
      throw new BadRequestException('You can only have 5 active API keys.');
    }

    const plainKey = this.generateKey();
    const hashedKey = this.hashKey(plainKey);

    const apiKey = this.apiKeyRepository.create({
      name: dto.name,
      permissions: dto.permissions,
      expires_at: this.calculateExpiry(dto.expiry),
      key: hashedKey,
      user: { id: user.id } as User,
    });

    await this.apiKeyRepository.save(apiKey);

    return {
      ...apiKey,
      key: plainKey, // Return plain key only once
    };
  }

  async rolloverApiKey(user: User, dto: RolloverApiKeyDto) {
    const oldKey = await this.apiKeyRepository.findOne({
      where: { id: dto.expired_key_id, user: { id: user.id } },
    });

    if (!oldKey) {
      throw new NotFoundException('API Key not found.');
    }

    if (oldKey.expires_at > new Date()) {
      throw new BadRequestException('Cannot rollover an active key.');
    }

    // Deactivate old key
    oldKey.is_active = false;
    await this.apiKeyRepository.save(oldKey);

    // Create new key with same permissions
    const plainKey = this.generateKey();
    const hashedKey = this.hashKey(plainKey);

    const newKey = this.apiKeyRepository.create({
      name: `${oldKey.name} (Rolled over)`,
      permissions: oldKey.permissions,
      expires_at: this.calculateExpiry(dto.expiry),
      key: hashedKey,
      user: { id: user.id } as User,
    });

    await this.apiKeyRepository.save(newKey);

    return {
      ...newKey,
      key: plainKey,
    };
  }

  async validateApiKey(plainKey: string): Promise<ApiKey | null> {
    const hashedKey = this.hashKey(plainKey);
    const apiKey = await this.apiKeyRepository.findOne({
      where: { key: hashedKey, is_active: true },
      relations: ['user'],
    });

    if (apiKey && apiKey.expires_at > new Date()) {
      return apiKey;
    }
    return null;
  }

  async listApiKeys(user: User) {
    return this.apiKeyRepository.find({
      where: { user: { id: user.id } },
      order: { created_at: 'DESC' },
    });
  }

  async revokeApiKey(user: User, id: string) {
    const key = await this.apiKeyRepository.findOne({
      where: { id, user: { id: user.id } },
    });

    if (!key) {
      throw new NotFoundException('API Key not found.');
    }

    if (!key.is_active) {
      throw new BadRequestException('API Key is already inactive.');
    }

    key.is_active = false;
    await this.apiKeyRepository.save(key);

    return { message: 'API Key revoked successfully.' };
  }
}
