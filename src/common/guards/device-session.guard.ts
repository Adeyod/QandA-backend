import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserSessionService } from '../../modules/user-session/user-session.service';

@Injectable()
export class DeviceSessionGuard implements CanActivate {
  constructor(private readonly userSessionService: UserSessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const deviceId = request.headers['x-device-id'];

    if (!deviceId) {
      throw new UnauthorizedException({
        message: 'Device ID is required',
        success: false,
        status: 401,
      });
    }

    const user = request.user;

    if (!user) {
      throw new UnauthorizedException({
        message: 'User not authenticated',
        success: false,
        status: 401,
      });
    }

    console.log('device section user:', user);

    const userId = user.sub.toString();

    const session = await this.userSessionService.findActiveSession(userId);

    if (!session) {
      throw new UnauthorizedException({
        message: 'Invalid or expired session',
        success: false,
        status: 401,
      });
    }
    console.log('device section session:', session);
    console.log('device section session.deviceId:', session.deviceId);

    if (session.deviceId !== deviceId) {
      throw new UnauthorizedException({
        message: 'You are already logged in on a device.',
        success: false,
        status: 401,
      });
    }

    request.session = session;

    return true;
  }
}
