import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QueryWithPaginationDto } from 'src/common/dto/query-with-pagination';
import { TransactionCreationDto } from '../dto/transaction-creation.dto';
import { TransactionResponseDto } from '../dto/transaction-response.dto';
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

  async getTransactionById(
    transactionId: string,
  ): Promise<TransactionResponseDto | null> {
    const id = new Types.ObjectId(transactionId);

    const transaction = await this.transactionModel.findById(id);

    return transaction;
  }

  async getAllUserTransactionsByWalletId(
    walletId: Types.ObjectId,
    queryWithPaginationDto: QueryWithPaginationDto,
  ): Promise<{
    transactionObj: TransactionResponseDto[] | null;
    totalPages: number;
    totalCount: number;
  }> {
    const { page, limit, searchParams } = queryWithPaginationDto;

    let query = this.transactionModel.find({ walletId });

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

      query = query.where({
        $or: [{ description: { $regex: regex } }],
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
          message: 'Page not found.',
          success: false,
          status: 404,
        });
      }
    }

    const transactions = await query.sort({ createdAt: -1 });

    if (transactions.length === 0) {
      throw new NotFoundException({
        message: 'transactions not found',
        success: false,
        status: 404,
      });
    }

    const response = {
      totalCount: count,
      totalPages: pages,
      transactionObj: transactions,
    };

    return response;
  }
  async getAllTransactions(
    queryWithPaginationDto: QueryWithPaginationDto,
  ): Promise<{
    transactionObj: TransactionResponseDto[] | null;
    totalPages: number;
    totalCount: number;
  }> {
    const { page, limit, searchParams } = queryWithPaginationDto;

    let query = this.transactionModel.find();

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

      query = query.where({
        $or: [{ description: { $regex: regex } }],
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
          message: 'Page not found.',
          success: false,
          status: 404,
        });
      }
    }

    const transactions = await query.sort({ createdAt: -1 });

    if (transactions.length === 0) {
      throw new NotFoundException({
        message: 'transactions not found',
        success: false,
        status: 404,
      });
    }

    const response = {
      totalCount: count,
      totalPages: pages,
      transactionObj: transactions,
    };

    return response;
  }
}
