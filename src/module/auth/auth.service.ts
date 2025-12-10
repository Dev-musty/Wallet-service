import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/Entity/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private jwtService: JwtService,
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
      return await this.userRepository.save(newUser);
    } catch (error) {
      console.error('Error in validateOAuthLogin:', error);
      throw new InternalServerErrorException(
        `Error validating user: ${error.message}`,
      );
    }
  }

  async login(user: User) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
