import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class TwoFAGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    // 🔐 BLOCK ACCESS IF 2FA REQUIRED BUT NOT VERIFIED
    if (user?.twoFARequired && !user?.twoFAVerified) {
      throw new ForbiddenException(
        '2FA verification required before accessing this resource',
      );
    }

    return true;
  }
}
