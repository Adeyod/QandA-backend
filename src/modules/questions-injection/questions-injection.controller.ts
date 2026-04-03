import { Controller, Get, Param } from '@nestjs/common';
import { QuestionsInjectionService } from './questions-injection.service';

@Controller('questions-injection')
export class QuestionsInjectionController {
  constructor(
    private readonly questionsInjectionService: QuestionsInjectionService,
  ) {}

  @Get('inject/:accessUser')
  async injectQuestions(@Param('accessUser') accessUser: string) {
    await this.questionsInjectionService.addSyncJob({ accessUser });
    return { message: 'Injection started in background' };
  }
}
