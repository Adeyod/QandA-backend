// user-session.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { CreateSessionDto } from './dtos/create-session.dto';
import { ForceSwitchDto } from './dtos/force-switch.dto';
import { UserSessionRepository } from './repositories/user-session.repository';

@Injectable()
export class UserSessionService {
  constructor(private readonly repo: UserSessionRepository) {}

  async findActiveSession(userId: string) {
    const response = await this.repo.findActiveSession(userId);

    return response;
  }

  async createSession(dto: CreateSessionDto) {
    const response = await this.repo.createSession({
      ...dto,
      isActive: true,
      lastActiveAt: new Date(),
    });

    if (!response) {
      throw new BadRequestException({
        message: 'Unable to create new session.',
        success: false,
        status: 400,
      });
    }

    return response;
  }

  async updateSession(sessionId: string) {
    const response = await this.repo.updateSession(sessionId, {
      lastActiveAt: new Date(),
    });

    return response;
  }

  async handleLogin(dto: CreateSessionDto) {
    console.log('dto:', dto);
    const activeSession = await this.repo.findActiveSession(dto.userId);
    console.log('activeSession:', activeSession);

    // No active session
    if (!activeSession) {
      return this.repo.createSession({
        ...dto,
        isActive: true,
        lastActiveAt: new Date(),
      });
    }

    // Same device
    if (activeSession.deviceId === dto.deviceId) {
      const response = await this.repo.updateSession(
        activeSession._id.toString(),
        {
          lastActiveAt: new Date(),
        },
      );
      console.log('response:', response);

      return response;
    }

    // Different device
    throw new ConflictException({
      message: 'You are logged in on another device',
      action: 'FORCE_SWITCH_REQUIRED',
      currentDevice: activeSession.deviceName, // nice UX addition
    });
  }

  async forceSwitch(dto: ForceSwitchDto) {
    // Deactivate all sessions
    await this.repo.deactivateSessions(dto.userId);

    // Create new session
    return this.repo.createSession({
      ...dto,
      isActive: true,
      lastActiveAt: new Date(),
      lastSwitchAt: new Date(),
    });
  }
}
