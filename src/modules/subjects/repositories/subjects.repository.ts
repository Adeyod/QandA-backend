import { NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import { SubjectResponseDto } from '../dto/subject-response.dto';
import { SubjectDocument } from '../schemas/subject.schema';

export class SubjectsRepository {
  constructor(
    @InjectModel('Subject') private subjectModel: Model<SubjectDocument>,
  ) {}

  async findByName(name: string): Promise<SubjectResponseDto | null> {
    return await this.subjectModel.findOne({ name });
  }

  async findById(id: Types.ObjectId): Promise<SubjectResponseDto | null> {
    return await this.subjectModel.findById(id);
  }

  async create(name: string): Promise<SubjectResponseDto> {
    const subject = new this.subjectModel({ name });
    return await subject.save();
  }

  async findAll(queryWithPaginationDto: QueryWithPaginationDto): Promise<{
    subjectObj: SubjectResponseDto[];
    totalPages: number;
    totalCount: number;
  }> {
    const { page, searchParams, limit } = queryWithPaginationDto;

    let query = this.subjectModel.find();
    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

      query = query.where({
        $or: [{ name: { $regex: regex } }],
      });
    }

    const count = await query.clone().countDocuments();
    let pages = 0;

    if (page !== undefined && limit !== undefined && count !== 0) {
      const offset = (page - 1) * limit;

      query = query.skip(offset).limit(limit);

      pages = Math.ceil(count / limit);

      if (page > pages) {
        throw new NotFoundException({
          message: 'Page can not be found.',
          status: 404,
          success: false,
        });
      }
    }

    const subjects = await query.sort({ createdAt: -1 });

    if (subjects.length === 0) {
      throw new NotFoundException({
        message: 'Subjects not found',
        success: false,
        status: 404,
      });
    }

    const response = {
      subjectObj: subjects,
      totalPages: pages,
      totalCount: count,
    };
    return response;
  }
}
