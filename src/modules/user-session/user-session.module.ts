import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSessionRepository } from './repositories/user-session.repository';
import { UserSession, UserSessionSchema } from './schemas/user-session.schema';
import { UserSessionController } from './user-session.controller';
import { UserSessionService } from './user-session.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserSession.name, schema: UserSessionSchema },
    ]),
  ],
  controllers: [UserSessionController],
  providers: [UserSessionService, UserSessionRepository],
  exports: [UserSessionService],
})
export class UserSessionModule {}
