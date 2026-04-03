import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Plan } from 'src/modules/users/schemas/user.schema';

export type QuestionDocument = Question & Document;

@Schema({ _id: false })
export class Option {
  label: string;
  type: string;
}
@Schema({ timestamps: true })
export class Question {
  @Prop({ required: true, trim: true })
  question: string;

  @Prop({ type: Object, default: {} })
  options: Option;

  @Prop({ required: true })
  apiQuestionId: string;

  @Prop({ default: '' })
  section: string;

  @Prop({ default: '' })
  image: string;

  @Prop({ type: String, default: '' })
  answer: string;

  @Prop({ type: String, default: '' })
  solution: string;

  @Prop({ type: String, default: '' })
  examType: string;

  @Prop({ type: String, default: '' })
  examYear: string;

  @Prop({ required: true })
  apiSubjectName: string;

  @Prop({ required: false })
  plan: Plan;

  @Prop({ required: true, ref: 'Subject' })
  subject: Types.ObjectId;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
QuestionSchema.index({ subject: 1, examType: 1 });
