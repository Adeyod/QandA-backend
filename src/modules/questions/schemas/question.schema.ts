import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Plan } from '../../../modules/users/schemas/user.schema';
import { QuestionType } from '../../questions-injection/dto/question-injection.dto';

export type QuestionDocument = Question & Document;

export enum ExamDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export enum ExamSection {
  objective = 'objective',
  essay = 'essay',
  comprehension = 'comprehension',
  oral = 'oral',
}

@Schema({ _id: false })
export class Option {
  label!: string;
  type!: string;
}

@Schema({ timestamps: true })
export class Question {
  @Prop({ required: true, trim: true })
  question!: string;

  @Prop({ type: Object, default: {} })
  options?: Option;

  @Prop({ required: true })
  apiQuestionId!: string;

  @Prop()
  instruction!: string;

  @Prop()
  topic!: string;

  @Prop({ type: String, enum: ExamSection, default: 'objective' })
  section?: ExamSection;

  @Prop({ default: '' })
  image!: string;

  @Prop({ type: String, default: '' })
  answer!: string;

  @Prop({ type: String, default: '' })
  solution!: string;

  @Prop({ type: String, default: '' })
  examType!: string;

  @Prop({ type: String, default: '' })
  examYear!: string;

  @Prop({ required: true })
  apiSubjectName!: string;

  @Prop({})
  explanation!: string;

  @Prop({ type: String, enum: ExamDifficulty, default: ExamDifficulty.EASY })
  difficulty!: ExamDifficulty;

  @Prop({})
  passage!: string;

  @Prop({})
  category!: string; // Grammer, Lexis, Narrative

  @Prop({ required: false })
  plan!: Plan;

  @Prop({ required: true, ref: 'Subject' })
  subject!: Types.ObjectId;

  @Prop({
    type: String,
    enum: QuestionType,
    required: true,
    default: QuestionType.MCQ,
  })
  questionType!: QuestionType;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
QuestionSchema.index({ subject: 1, examType: 1 });
