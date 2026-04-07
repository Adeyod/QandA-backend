import { NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import { EXAM_PLAN_MAP } from '../../../common/utils/maps/exam-plan.map';
import { GetQuestionsDto } from '../dto/get-questions.dto';
import { QuestionDocument } from '../schemas/question.schema';

export class QuestionsRepository {
  constructor(
    @InjectModel('Question') private questionModel: Model<QuestionDocument>,
  ) {}

  async findById(id: Types.ObjectId) {
    return await this.questionModel.findById(id);
  }

  async findAll(queryWithPaginationDto: QueryWithPaginationDto) {
    const { page, limit, searchParams } = queryWithPaginationDto;

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
    const summary = await this.questionModel.aggregate([
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

    console.log('summary:', summary);

    return summary;
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

  async getFreeQuestions(
    getQuestionsDto: GetQuestionsDto,
  ): Promise<QuestionDocument[]> {
    const { plan, subject, year } = getQuestionsDto;
    const id = new Types.ObjectId(subject);

    const questions = await this.questionModel
      .find({
        // plan,
        examYear: year,
        subject: id,
      })
      .lean();

    return questions;
  }
  async getPaidQuestions(
    getQuestionsDto: GetQuestionsDto,
  ): Promise<QuestionDocument[]> {
    const { plan, subject, year } = getQuestionsDto;
    const id = new Types.ObjectId(subject);

    const questions = await this.questionModel
      .find({
        // plan,
        examYear: year,
        subject: id,
      })
      .lean();

    console.log('questions:', questions);

    return questions;
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

      console.log('newQuestions:', newQuestions);
      // insertMany with ordered: false to skip duplicates safely
      // const res = await this.questionModel.insertMany(newQuestions, {
      //   ordered: false,
      // });

      const res = await this.questionModel.insertMany(newQuestions);
      console.log('res:', res);
    } catch (error: any) {
      if (error.code === 11000) {
        console.warn('Duplicate questions skipped.');
      } else {
        throw error;
      }
    }
  }

  async backfillPlans() {
    const BATCH_SIZE = 2000;

    while (true) {
      const questions = await this.questionModel
        .find({
          $or: [{ plan: { $exists: false } }, { plan: null }],
        })
        .limit(BATCH_SIZE);

      if (questions.length === 0) {
        console.log('✅ Migration complete');
        break;
      }

      const bulkOps = questions
        .map((q) => {
          const examType = q.examType?.trim().toLowerCase();

          console.log('examType:', examType);
          console.log('q:', q);

          const normalizedExamType = examType?.replace(/\s+/g, '-');

          const plan = EXAM_PLAN_MAP[normalizedExamType];

          if (!plan) {
            console.warn(`Unknown examType: ${q.examType}`);
            return null;
          }

          return {
            updateOne: {
              filter: { _id: q._id },
              update: { $set: { plan } },
            },
          };
        })
        .filter(
          (
            op,
          ): op is {
            updateOne: {
              filter: { _id: (typeof questions)[number]['_id'] };
              update: { $set: { plan } };
            };
          } => op !== null,
        );

      if (bulkOps.length > 0) {
        await this.questionModel.bulkWrite(bulkOps);
      }

      console.log(`✅ Updated ${bulkOps.length} questions`);
    }
  }

  async normalizeOptionsToLowerCase() {
    try {
      const affectedYears = [
        '2000',
        '2001',
        '2002',
        '2003',
        '2004',
        '2005',
        '2006',
      ];

      // Fetch only questions in affectedYears with examType 'waec'
      const questions = await this.questionModel.find(
        {
          examType: 'waec',
          examYear: { $in: affectedYears },
        },
        { options: 1, answer: 1 },
      ); // only fetch needed fields

      for (const q of questions) {
        if (!q.options) continue; // skip if options is undefined

        let needsUpdate = false;

        // Convert options to lowercase keys & values
        const optionsObj = Object.fromEntries(
          Object.entries(q.options).map(([key, value]) => {
            const newKey = key.toLowerCase();
            const newValue = value.toLowerCase();
            if (newKey !== key || newValue !== value) needsUpdate = true;
            return [newKey, newValue];
          }),
        );

        // Lowercase answer if it exists
        const lowercasedAnswer = q.answer ? q.answer.toLowerCase() : q.answer;
        if (q.answer && lowercasedAnswer !== q.answer) needsUpdate = true;

        if (needsUpdate) {
          const updated = await this.questionModel.updateOne(
            { _id: q._id },
            { options: optionsObj, answer: lowercasedAnswer },
          );

          console.log('updated:', updated);
        }
      }

      console.log('Normalization complete for affected years!');
    } catch (error) {
      console.error('Error normalizing questions:', error);
    }
  }

  // async getQuestionsByExamYear() {
  //   const EXAM_TYPES = [
  //     'utme',
  //     'post-utme',
  //     'wassce',
  //     'jamb',
  //     'neco',
  //     'ijmb',
  //     'nursing',
  //     'medical',
  //     'law',
  //     'coren',
  //     'ican',
  //     'anna',
  //     'ielts',
  //   ];

  //   const docs = await this.questionModel.find({
  //     examYear: { $in: EXAM_TYPES },
  //     examType: { $regex: /^\d{4}$/ },
  //   });
  //   console.log('docs:', docs.length);

  //   const bulkOps = docs.map((doc) => ({
  //     updateOne: {
  //       filter: { _id: doc._id },
  //       update: {
  //         $set: {
  //           examType: doc.examYear,
  //           examYear: doc.examType,
  //         },
  //       },
  //     },
  //   }));

  //   await this.questionModel.bulkWrite(bulkOps);
  //   console.log('bulkOps:', bulkOps.length);
  // }

  async getAllExamTypes(): Promise<string[]> {
    const examTypes = await this.questionModel.distinct('examType');

    console.log('examTypes:', examTypes);
    return examTypes;
  }
  async getAllExamYears(): Promise<string[]> {
    const examYears = await this.questionModel.distinct('examYear');

    console.log('examYears:', examYears);
    return examYears;
  }

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
        update: { $set: { options: q.options && q.options[0] } },
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
