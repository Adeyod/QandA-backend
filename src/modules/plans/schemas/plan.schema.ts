import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum PlanCode {
  SECONDARY = 'SECONDARY',
  TERTIARY = 'TERTIARY',
  OTHERS = 'OTHERS',
}

export type PlanDocument = HydratedDocument<Plan>;

@Schema({ timestamps: true })
export class Plan {
  @Prop({ required: true, unique: true })
  categoryId!: string; // e.g. "secondary"

  @Prop({ required: true, enum: PlanCode, unique: true })
  code!: PlanCode;

  @Prop({ required: true })
  label!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ default: true })
  isPremium!: boolean;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ default: true })
  isActive!: boolean;
}

export const PlanSchema = SchemaFactory.createForClass(Plan);
