import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { SuccessMessage } from 'src/common/decorators/success-message.decorator';
import { ApiResponseDto } from 'src/common/dto/api-response.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Role } from '../users/schemas/user.schema';
import { QuestionsService } from './questions.service';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get('get-question-by-id/:questionId')
  @UseGuards(JwtAuthGuard)
  @SuccessMessage('Question fetched successfully.')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'This is the endpoint for fetching a question by the questionId',
    description:
      'This endpoint respond with a particular question which its ID is passed as a param',
  })
  @ApiResponse({
    status: 200,
    description: 'Question fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch question',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getQuestionById(@Param('questionId') questionId: string) {
    return await this.questionsService.findById(questionId);
  }

  @Get('count-questions-by-subjectId/:subjectId')
  @ApiOperation({
    summary:
      'This gives response as to the number of questions we have for a subject',
    description: 'Get question summary for a given subject',
  })
  @ApiResponse({
    status: 200,
    description: 'Question summary fetched successfully for this subject.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request. Unable to fetch question summary for this subject.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async countQuestionsBySubjectId(@Param('subjectId') subjectId: string) {
    return await this.questionsService.countQuestionsBySubjectId(subjectId);
  }

  @Get('count-questions-by-subjectId-and-year/:subjectId/:year')
  @SuccessMessage(
    'Question summary fetched successfully for this subject for the year.',
  )
  @ApiOperation({
    summary:
      'This gives response as to the number of questions we have for a given year for a subject',
    description: 'Get question summary for a given year',
  })
  @ApiResponse({
    status: 200,
    description:
      'Question summary fetched successfully for this subject for the year.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request. Unable to fetch question summary for this subject.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async countQuestionsBySubjectIdAndYear(
    @Param('subjectId') subjectId: string,
    @Param('year') year: string,
  ) {
    return await this.questionsService.countQuestionsBySubjectIdAndYear(
      subjectId,
      year,
    );
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Question summary data fetched successfully')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetching question summary',
    description:
      'This is the endpoint for fetching summary of all the questions inside the database',
  })
  @ApiResponse({
    status: 200,
    description: 'Question summary fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch questions summary',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getQuestionsSummary() {
    return await this.questionsService.getQuestionsSummary();
  }
}
