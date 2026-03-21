import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TransactionsRepository } from 'src/modules/transactions/repositories/transaction.repository';
import { TransactionType } from 'src/modules/transactions/schemas/transaction.schema';
import { WalletCreditDto } from '../dto/wallet-credit.dto';
import { WalletDebitDto } from '../dto/wallet-debit.dto';
import { WalletResponseDto } from '../dto/wallet-response.dto';
import { WalletDocument } from '../schemas/wallet.schema';

@Injectable()
export class WalletsRepository {
  constructor(
    @InjectModel('Wallet') private walletModel: Model<WalletDocument>,
    private transactionsRepository: TransactionsRepository,
  ) {}

  async createWallet(userId: string): Promise<WalletResponseDto> {
    const user = new Types.ObjectId(userId);
    const newWallet = await new this.walletModel({
      userId: user,
      balance: 0,
    }).save();

    return newWallet;
  }

  async findWalletByUserId(userId: string): Promise<WalletResponseDto | null> {
    const user = new Types.ObjectId(userId);

    const wallet = await this.walletModel.findOne({ userId: user });

    return wallet;
  }
  async findWalletById(walletId: string): Promise<WalletResponseDto | null> {
    const id = new Types.ObjectId(walletId);

    const wallet = await this.walletModel.findById(id);

    return wallet;
  }

  async creditWallet(walletCreditDto: WalletCreditDto) {
    const { walletId, amount, description } = walletCreditDto;
    const id = new Types.ObjectId(walletId);

    await this.walletModel.findByIdAndUpdate(id, {
      $inc: { balance: amount },
    });

    const payload = {
      walletId,
      amount,
      description,
      transactionType: TransactionType.CREDIT,
    };

    const transactionCreation =
      await this.transactionsRepository.createTransaction(payload);
  }

  async debitWallet(walletDebitDto: WalletDebitDto) {
    const { walletId, amount, description } = walletDebitDto;

    const id = new Types.ObjectId(walletId);

    const wallet = await this.walletModel.findById(id);

    if (!wallet) {
      throw new NotFoundException({
        message: 'Wallet not found',
        success: false,
        status: 404,
      });
    }

    if (wallet.balance < amount) {
      throw new BadRequestException({
        message: 'Insufficient balance',
        success: false,
        status: 400,
      });
    }

    await this.walletModel.findByIdAndUpdate(wallet._id, {
      $inc: { balance: -amount },
    });

    const payload = {
      walletId,
      amount,
      description,
      transactionType: TransactionType.DEBIT,
    };
    const debitTransaction =
      await this.transactionsRepository.createTransaction(payload);
  }
}
