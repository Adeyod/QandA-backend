import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { SubjectsRepository } from '../subjects/repositories/subjects.repository';
import { GetQuestionsDto } from './dto/get-questions.dto';
import { QuestionsRepository } from './repositories/questions.repository';

@Injectable()
export class QuestionsService {
  constructor(
    private questionsRepository: QuestionsRepository,
    private subjectsRepository: SubjectsRepository,
  ) {}

  async findById(questionId: string) {
    const id = new Types.ObjectId(questionId);
    const question = await this.questionsRepository.findById(id);
    if (!question) {
      throw new NotFoundException({
        message: 'Question not found.',
        success: false,
        status: 404,
      });
    }
    return question;
  }

  async countQuestionsBySubjectId(subjectId: string) {
    const id = new Types.ObjectId(subjectId);
    return await this.questionsRepository.countQuestionsBySubject(id);
  }

  async getQuestionsSummary() {
    return await this.questionsRepository.getQuestionsSummary();
  }

  async countQuestionsBySubjectIdAndYear(subjectId: string, year: string) {
    const id = new Types.ObjectId(subjectId);
    return await this.questionsRepository.countQuestionsBySubjectAndYear(
      id,
      year,
    );
  }

  async getFreeQuestionsPerPlan(getQuestionsDto: GetQuestionsDto) {
    const { plan, year, subjectId, examType } = getQuestionsDto;

    const freeYears = ['2000', '2001'];
    const freeSubjects = ['mathematics', 'english'];

    if (!freeYears.includes(getQuestionsDto.year)) {
      throw new ForbiddenException({
        message: `You need to subscribe to view ${getQuestionsDto.year} questions.`,
        status: 403,
        success: false,
      });
    }

    const subject = new Types.ObjectId(subjectId);

    const getSubject = await this.subjectsRepository.findById(subject);

    if (!getSubject) {
      throw new NotFoundException({
        message: 'Subject not found',
        success: false,
        status: 404,
      });
    }

    if (!freeSubjects.includes(getSubject.name.toLowerCase())) {
      throw new ForbiddenException({
        message: `${getSubject.name} is not included in free plan. Please subscribe to ${plan} plan to proceed.`,
        success: false,
        status: 403,
      });
    }

    const input = {
      plan,
      year,
      subjectId: getSubject._id.toString(),
      examType,
    };
    return await this.questionsRepository.getFreeQuestions(input);
  }

  async getPaidQuestionsPerPlan(getQuestionsDto: GetQuestionsDto) {
    const { plan, year, subjectId, examType } = getQuestionsDto;

    const subject = new Types.ObjectId(subjectId);

    const getSubject = await this.subjectsRepository.findById(subject);

    if (!getSubject) {
      throw new NotFoundException({
        message: 'Subject not found',
        success: false,
        status: 404,
      });
    }

    const input = {
      plan,
      year,
      subjectId: getSubject._id.toString(),
      examType,
    };
    const questions = await this.questionsRepository.getPaidQuestions(input);
    console.log(
      'service questions:',
      questions.map((q) => q.apiQuestionId),
    );
    console.log('service questions length:', questions.length);
    return questions;
  }
}
