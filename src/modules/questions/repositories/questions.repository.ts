import { NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QueryQuestionsDto } from '../dto/query-question.dto';
import { QuestionDocument } from '../schemas/question.schema';

export class QuestionsRepository {
  constructor(
    @InjectModel('Question') private questionModel: Model<QuestionDocument>,
  ) {}

  async findById(id: Types.ObjectId) {
    return await this.questionModel.findById(id);
  }

  async findAll(queryQuestionsDto: QueryQuestionsDto) {
    const { page, limit, searchParams } = queryQuestionsDto;

    let query = this.questionModel.find();

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

      query = query.where({
        $or: [
          { apiSubjectName: { $regex: regex } },
          { answer: { $regex: regex } },
          { solution: { $regex: regex } },
        ],
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

    const questions = await query.sort({ createdAt: -1 });

    if (questions.length === 0) {
      throw new NotFoundException({
        message: 'Questions not found.',
        success: false,
        status: 404,
      });
    }

    const response = {
      questionObj: questions,
      totalPages: pages,
      totalLimit: limit,
    };

    return response;
  }

  async countQuestionsBySubject(subjectId: Types.ObjectId) {
    const result = await this.questionModel.aggregate([
      {
        $match: { subject: subjectId },
      },

      // 1️⃣ Group by year + examType
      {
        $group: {
          _id: {
            year: '$examYear',
            examType: '$examType',
          },
          count: { $sum: 1 },
        },
      },

      // 2️⃣ Group by year
      {
        $group: {
          _id: '$_id.year',
          totalPerYear: { $sum: '$count' },
          examTypes: {
            $push: {
              examType: '$_id.examType',
              count: '$count',
            },
          },
        },
      },

      {
        $sort: { _id: 1 },
      },

      // 3️⃣ Final grouping (overall total)
      {
        $group: {
          _id: null,
          totalCount: { $sum: '$totalPerYear' },
          years: {
            $push: {
              year: '$_id',
              total: '$totalPerYear',
              examTypes: '$examTypes',
            },
          },
        },
      },

      {
        $project: {
          _id: 0,
          totalCount: 1,
          years: 1,
        },
      },
    ]);

    return result[0] || { totalCount: 0, years: [] };
  }

  // async countQuestionsBySubjectAndYear(
  //   subjectId: Types.ObjectId,
  //   year: string,
  // ) {
  //   const question = this.questionModel.find({
  //     subject: subjectId,
  //     examYear: year,
  //   });
  //   const count = question.clone().countDocuments();
  //   return count;
  // }

  async countQuestionsBySubjectAndYear(
    subjectId: Types.ObjectId,
    year: string,
  ) {
    const result = await this.questionModel.aggregate([
      {
        $match: {
          subject: subjectId,
          examYear: year,
        },
      },

      {
        $group: {
          _id: '$examType',
          count: { $sum: 1 },
        },
      },

      {
        $group: {
          _id: null,
          totalCount: { $sum: '$count' },
          examTypes: {
            $push: {
              examType: '$_id',
              count: '$count',
            },
          },
        },
      },

      {
        $project: {
          _id: 0,
          totalCount: 1,
          examTypes: 1,
        },
      },
    ]);

    return result[0] || { totalCount: 0, examTypes: [] };
  }

  async getQuestionsSummaryRaw() {
    return await this.questionModel.aggregate([
      {
        $group: {
          _id: {
            subject: '$subject',
            year: '$examYear',
            examType: '$examType',
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: {
            subject: '$_id.subject',
            year: '$_id.year',
          },
          totalPerYear: { $sum: '$count' },
          examTypes: {
            $push: {
              examType: '$_id.examType',
              count: '$count',
            },
          },
        },
      },

      {
        $group: {
          _id: '$_id.subject',
          total: { $sum: '$totalPerYear' },
          years: {
            $push: {
              year: '$_id.year',
              total: '$totalPerYear',
              examTypes: '$examTypes',
            },
          },
        },
      },

      {
        $lookup: {
          from: 'subjects',
          localField: '_id',
          foreignField: '_id',
          as: 'subjectInfo',
        },
      },
      {
        $unwind: '$subjectInfo',
      },
      {
        $project: {
          _id: 0,
          subjectId: '$_id',
          subjectName: '$subjectInfo.name',
          total: 1,
          years: 1,
        },
      },
      {
        $sort: { subjectName: 1 },
      },
    ]);
  }

  async getQuestionsTotal() {
    return await this.questionModel.countDocuments();
  }
  async getQuestionsSummary() {
    const [summary, totalQuestions] = await Promise.all([
      this.getQuestionsSummaryRaw(),
      this.getQuestionsTotal(),
    ]);

    const result = {
      summary,
      totalQuestions,
    };

    return result;
  }

  async changeSubjectToMongooseObjectForQuestion(name: string, id: string) {
    const subjectId = new Types.ObjectId(id);
    const result = await this.questionModel.updateMany(
      { apiSubjectName: name },
      {
        $set: {
          subject: subjectId,
        },
      },
    );

    console.log('Updated docs:', result.modifiedCount);

    return result;
  }

  async insertQuestions(questions: any[]) {
    if (!questions || questions.length === 0) return;

    // Normalize questions and remove any with undefined ID
    const validQuestions = questions.filter(
      (q) => q.apiQuestionId && q.apiSubjectName,
    );
    if (validQuestions.length === 0) return;

    // Remove duplicates inside this batch
    const uniqueMap = new Map<string, any>();
    validQuestions.forEach((q) => {
      const key = `${q.apiQuestionId}_${q.apiSubjectName}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, q);
      }
    });
    const uniqueQuestions = Array.from(uniqueMap.values());

    console.log('uniqueQuestions:', uniqueQuestions);
    if (uniqueQuestions.length === 0) return;

    try {
      const compoundKeys = uniqueQuestions.map((q) => ({
        apiQuestionId: q.apiQuestionId,
        apiSubjectName: q.apiSubjectName,
      }));

      const existing = await this.questionModel
        .find({
          $or: compoundKeys,
        })
        .select('apiQuestionId apiSubjectName')
        .lean();

      const existingSet = new Set(
        existing.map((q) => `${q.apiQuestionId}_${q.apiSubjectName}`),
      );

      const newQuestions = uniqueQuestions.filter(
        (q) => !existingSet.has(`${q.apiQuestionId}_${q.apiSubjectName}`),
      );

      if (newQuestions.length === 0) return;

      // insertMany with ordered: false to skip duplicates safely
      await this.questionModel.insertMany(newQuestions, { ordered: false });
    } catch (error: any) {
      if (error.code === 11000) {
        console.warn('Duplicate questions skipped.');
      } else {
        throw error;
      }
    }
  }

  // async flattenOptions() {
  //   await this.questionModel.updateMany(
  //     { 'options.0': { $exists: true } }, // array has at least 1 element
  //     [
  //       {
  //         $set: {
  //           options: { $arrayElemAt: ['$options', 0] }, // replace array with first element
  //         },
  //       },
  //     ],
  //   );
  // }

  async flattenOptions() {
    // Step 1: Fetch all questions where options is an array with exactly 1 element
    const questions = await this.questionModel.find({
      options: { $type: 'array', $size: 1 },
    });

    console.log('questionslength:', questions.length);

    if (questions.length === 0) {
      console.log('No questions need flattening.');
      return;
    }

    // Step 2: Prepare bulk operations
    const bulkOps = questions.map((q) => ({
      updateOne: {
        filter: { _id: q._id },
        update: { $set: { options: q.options[0] } },
      },
    }));

    // Step 3: Execute bulkWrite
    const result = await this.questionModel.bulkWrite(bulkOps, {
      ordered: false,
    });

    console.log(
      `Flattened options successfully for: ${result.modifiedCount} questions`,
    );
    console.log(
      `Failed to flatten options for: ${questions.length - result.modifiedCount} questions`,
    );
  }
}
