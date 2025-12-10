import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class CompositeAuthGuard extends AuthGuard(['jwt', 'api-key']) {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    // If user is found, return it
    if (user) {
      return user;
    }

    // If no user, throw error
    if (err) {
      throw err;
    }

    throw new Error('Authentication failed');
  }
}
