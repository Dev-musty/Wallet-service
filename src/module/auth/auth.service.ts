import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/Entity/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { WalletService } from '../wallet/wallet.service';

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private jwtService: JwtService,
    private readonly walletService: WalletService,
  ) {}

  async validateOAuthLogin(details: {
    email: string;
    fullName: string;
    googleID: string;
  }): Promise<User> {
    try {
      const user = await this.userRepository.findOne({
        where: { email: details.email },
      });

      if (user) {
        return user;
      }

      const newUser = this.userRepository.create(details);
      const savedUser = await this.userRepository.save(newUser);

      // Create wallet for new user
      await this.walletService.createWallet(savedUser);

      return savedUser;
    } catch (error) {
      console.error('Error in validateOAuthLogin:', error);
      throw new InternalServerErrorException(
        `Error validating user: ${error.message}`,
      );
    }
  }

  async login(user: User) {
    const payload = { email: user.email, sub: user.id };
    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' });
    user.refreshToken = refresh_token;
    await this.userRepository.save(user);
    return {
      access_token,
      refresh_token,
    };
  }

  async refreshToken(userId: string, refreshToken: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || user.refreshToken !== refreshToken) {
      throw new InternalServerErrorException('Invalid refresh token');
    }
    const payload = { email: user.email, sub: user.id };
    const access_token = this.jwtService.sign(payload);
    const new_refresh_token = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });
    user.refreshToken = new_refresh_token;
    await this.userRepository.save(user);
    return {
      access_token,
      refresh_token: new_refresh_token,
    };
  }
}
