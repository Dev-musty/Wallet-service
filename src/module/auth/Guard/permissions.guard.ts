import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );
    if (!requiredPermissions) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // If user is not an API Key (e.g. JWT user), allow access
    // API Key users will have a 'permissions' property
    if (!user.permissions) {
      return true;
    }

    const hasPermission = requiredPermissions.some((permission) =>
      user.permissions.includes(permission),
    );

    return hasPermission;
  }
}
