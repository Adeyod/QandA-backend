import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { QueryWithPaginationDto } from 'src/common/dto/query-with-pagination';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { SubjectsRepository } from './repositories/subjects.repository';

@Injectable()
export class SubjectsService {
  constructor(private subjectsRepository: SubjectsRepository) {}
  async createSubject(createSubjectDto: CreateSubjectDto) {
    const subjectExist = await this.subjectsRepository.findByName(
      createSubjectDto.name.toLowerCase(),
    );

    if (subjectExist) {
      throw new BadRequestException({
        message: 'Subject already exist.',
        status: 400,
        success: false,
      });
    }

    const newSubject = await this.subjectsRepository.create(
      createSubjectDto.name.trim().toLowerCase(),
    );

    if (!newSubject) {
      throw new BadRequestException({
        message: 'Unable to create subject',
        success: false,
        status: 400,
      });
    }

    return newSubject;
  }

  async getAllSubjects(queryWithPaginationDto: QueryWithPaginationDto) {
    return this.subjectsRepository.findAll(queryWithPaginationDto);
  }

  async getSubjectById(subjectId: string) {
    const id = new Types.ObjectId(subjectId);
    const subject = await this.subjectsRepository.findById(id);

    if (!subject) {
      throw new NotFoundException({
        message: 'Subject not found.',
        success: false,
        status: 404,
      });
    }

    return subject;
  }
}
