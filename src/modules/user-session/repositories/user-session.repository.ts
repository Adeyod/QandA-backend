// user-session.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  UserSession,
  UserSessionDocument,
} from '../schemas/user-session.schema';

@Injectable()
export class UserSessionRepository {
  constructor(
    @InjectModel(UserSession.name)
    private sessionModel: Model<UserSessionDocument>,
  ) {}

  async findActiveSession(userId: Types.ObjectId) {
    const response = await this.sessionModel.find({
      userId,
      isActive: true,
    });

    console.log('findActiveSession response:', response);

    return response;
  }

  async findByUserAndDevice(userId: Types.ObjectId, deviceId: string) {
    const response = await this.sessionModel.findOne({ userId, deviceId });

    console.log('findByUserAndDevice response:', response);

    return response;
  }

  async createSession(data: Partial<UserSession>) {
    const response = await new this.sessionModel(data).save();

    console.log('createSession response:', response);

    return response;
  }

  async updateSession(id: string, data: Partial<UserSession>) {
    const response = await this.sessionModel.findByIdAndUpdate(id, data, {
      new: true,
    });

    console.log('updateSession response:', response);

    return response;
  }

  async deactivateSessions(userId: Types.ObjectId) {
    const response = await this.sessionModel.updateMany(
      { userId, isActive: true },
      { isActive: false },
    );

    console.log('deactivateSessions response:', response);

    return response;
  }

  async deactivateOtherSessions(userId: string, deviceId: string) {
    const response = await this.sessionModel.updateMany(
      { userId, deviceId: { $ne: deviceId }, isActive: true },
      { isActive: false },
    );

    console.log('deactivateOtherSessions response:', response);

    return response;
  }
}
