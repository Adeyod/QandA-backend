import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    // console.log('AUTH HEADER:', req.headers.authorization);
    // console.log('I am running JWT AUTH GUARD');
    // console.log('JwtAuthGuard context:', context);

    const result = (await super.canActivate(context)) as boolean;

    // console.log('JWTAuthGuard result:', result);
    return result;
  }

  handleRequest(err: any, user: any, info: any) {
    // console.log('JwtAuth info:', info);
    // console.log('JwtAuth user:', user);
    if (err || !user) {
      console.log('JwtAuth err:', err);
      throw (
        err ||
        new UnauthorizedException({
          message: 'Unauthorized',
          status: 401,
          success: false,
        })
      );
    }

    return user;
  }
}
