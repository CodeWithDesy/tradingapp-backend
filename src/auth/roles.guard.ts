import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from 'src/auth/roles.decorator';
import { UserRole } from 'src/users/entities/user.entity/user.entity';


// Runs AFTER JwtAuthGuard — relies on req.user already being set. A route
// with no @Roles() decorator is left open to any authenticated user.
@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();
        if (!user || !requiredRoles.includes(user.role)) {
            throw new HttpException(
                'You do not have permission to access this resource.',
                HttpStatus.FORBIDDEN,
            );
        }
        return true;
    }
}