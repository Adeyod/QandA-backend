import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum Plan {
  SECONDARY = 'SECONDARY',
  TERTIARY = 'TERTIARY',
  OTHERS = 'OTHERS',
}

export const PLAN_PRICES: Record<Plan, number> = {
  [Plan.SECONDARY]: 2000,
  [Plan.TERTIARY]: 3000,
  [Plan.OTHERS]: 5000,
};

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: String, enum: Role, default: Role.USER })
  role: Role;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: false })
  referralCode: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  referredBy: Types.ObjectId;

  @Prop({
    type: [
      {
        _id: false,
        userId: { type: Types.ObjectId, ref: 'User', required: true },
        level: { type: Number, required: true },
      },
    ],
    default: [],
  })
  referralChain: {
    userId: Types.ObjectId;
    level: number;
  }[];

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: false })
  hasPaid: boolean;

  @Prop({
    type: [String],
    enum: Plan,
    default: [],
  })
  plans: Plan[];

  @Prop({
    type: {
      deviceId: { type: String },
      deviceName: { type: String },
      lastLogin: { type: Date },
    },
    _id: false,
    default: null,
  })
  device: {
    deviceId: string; // will be generated from frontend if the user does not have one
    deviceName: string; // comes from frontend
    lastLogin: Date;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ 'referralChain.userId': 1 });
