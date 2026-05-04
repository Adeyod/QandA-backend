import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Plan } from '../../users/schemas/user.schema';

export type SubjectDocument = Subject & Document;

@Schema({ timestamps: true })
export class Subject {
  @Prop({ required: true })
  name!: string;

  @Prop({
    type: [String],
    enum: Plan,
    required: true,
    default: [],
  })
  plans!: Plan[];
}

export const SubjectSchema = SchemaFactory.createForClass(Subject);
