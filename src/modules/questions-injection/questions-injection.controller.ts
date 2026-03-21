import { Body, Controller, Get } from '@nestjs/common';
import { InjectQuestionsDto } from './dto/inject-questions.dto';
import { QuestionsInjectionService } from './questions-injection.service';

@Controller('questions-injection')
export class QuestionsInjectionController {
  constructor(
    private readonly questionsInjectionService: QuestionsInjectionService,
  ) {}

  @Get('inject')
  async injectQuestions(@Body() injectQuestionsDto: InjectQuestionsDto) {
    await this.questionsInjectionService.addSyncJob(injectQuestionsDto);
    return { message: 'Injection started in background' };
  }
}
