import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'f377dbb4000f012992789bb903b71bc4';
console.log(JWT_REFRESH_SECRET);
@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: JWT_REFRESH_SECRET,
      passReqToCallback: true,
    } as any);
  }

  validate(req: any, payload: any) {
    const authHeader = req.get('authorization') || '';
    const refreshToken = authHeader.replace('Bearer ', '').trim();

    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      refreshToken,
    };
  }
}
