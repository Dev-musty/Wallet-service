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
    const { user } = context.switchToHttp().getRequest();

    // If user is not an API Key (e.g. JWT user), maybe allow or deny?
    // Assuming API Key entity has 'permissions' array.
    if (!user || !user.permissions) {
      // If it's a regular user, maybe they are allowed?
      // For now, let's strict check for permissions property.
      return false;
    }

    return requiredPermissions.some((permission) =>
      user.permissions.includes(permission),
    );
  }
}
