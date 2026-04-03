import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../users/schemas/user.schema';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { SubjectResponseDto } from './dto/subject-response.dto';
import { SubjectsService } from './subjects.service';

@ApiExtraModels(SubjectResponseDto)
@Controller('subjects')
export class SubjectsController {
  constructor(private subjectsService: SubjectsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @Post('create-subject')
  @SuccessMessage('Subject created successfully.')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Subject creation',
    description: 'Creates a new subject',
  })
  @ApiResponse({
    status: 201,
    description: 'Subject created successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to create subject',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async createSubject(@Body() createSubjectDto: CreateSubjectDto) {
    return await this.subjectsService.createSubject(createSubjectDto);
  }

  @Get('get-all-subjects')
  @SuccessMessage('Subjects fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all subjects with optional page, searchParams or limit',
  })
  @ApiResponse({
    status: 200,
    description: 'Lists of all subjects with pagination',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(SubjectResponseDto) },
        },

        meta: {
          type: 'object',
          properties: {
            totalPages: { type: 'number' },
            totalCount: { type: 'number' },
            limit: { type: 'number' },
          },
        },
      },
    },
  })
  async getAllSubjects(
    @Query() queryWithPaginationDto: QueryWithPaginationDto,
  ) {
    return await this.subjectsService.getAllSubjects(queryWithPaginationDto);
  }

  @Get(':subjectId')
  @SuccessMessage('Subject fetched successfully')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Subject fetched successfully.',
    description: 'This is to fetch single subject using subjectId',
  })
  @ApiResponse({
    status: 200,
    description: 'Subject fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to find subject',
  })
  @ApiResponse({
    status: 404,
    description: 'Subject not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getSubjectById(@Param('subjectId') subjectId: string) {
    return await this.subjectsService.getSubjectById(subjectId);
  }
}
