import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TransactionCreationDto } from '../dto/transaction-creation.dto';
import { TransactionDocument } from '../schemas/transaction.schema';

@Injectable()
export class TransactionsRepository {
  constructor(
    @InjectModel('Transaction')
    private transactionModel: Model<TransactionDocument>,
  ) {}

  async createTransaction(transactionCreationDto: TransactionCreationDto) {
    const { walletId, amount, description, transactionType } =
      transactionCreationDto;
    const id = new Types.ObjectId(walletId);

    const newTransaction = await new this.transactionModel({
      walletId: id,
      amount,
      type: transactionType,
      description,
    }).save();

    return newTransaction;
  }
}
