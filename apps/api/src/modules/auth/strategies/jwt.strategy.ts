import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { AccessTokenPayload } from '@twomc/shared';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser } from '../authenticated-user';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('jwt.accessSecret'),
      algorithms: ['HS256'],
    });
  }

  validate(payload: AccessTokenPayload): AuthenticatedUser {
    return {
      id: payload.sub,
      email: payload.email,
      username: payload.username,
      roleGroup: payload.roleGroup,
    };
  }
}
