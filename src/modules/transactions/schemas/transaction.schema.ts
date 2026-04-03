import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionDocument = Transaction & Document;

export enum TransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: 'Wallet', required: true })
  walletId!: Types.ObjectId;

  @Prop({ required: true })
  amount!: number;

  @Prop({ type: String, enum: TransactionType, required: true })
  type!: TransactionType;

  @Prop({ type: String, required: true })
  description!: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
