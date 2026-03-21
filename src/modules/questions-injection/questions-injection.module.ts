import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestionsModule } from '../questions/questions.module';
import { QuestionsInjectionController } from './questions-injection.controller';
import { QuestionsProcessor } from './questions-injection.processor';
import { QuestionsInjectionService } from './questions-injection.service';
import {
  SyncProgress,
  SyncProgressSchema,
} from './schemas/sync-progress.schema';

@Module({
  imports: [
    QuestionsModule,
    MongooseModule.forFeature([
      { name: SyncProgress.name, schema: SyncProgressSchema },
    ]),
    BullModule.registerQueueAsync({
      name: 'questions-sync',
    }),
  ],
  controllers: [QuestionsInjectionController],
  providers: [QuestionsInjectionService, QuestionsProcessor],
  exports: [QuestionsInjectionService],
})
export class QuestionsInjectionModule {}
