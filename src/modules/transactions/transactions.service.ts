import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { QueryWithPaginationDto } from 'src/common/dto/query-with-pagination';
import { JwtUser } from 'src/common/types/jwt-user.type';
import { UsersRepository } from '../users/repositories/users.repository';
import { Role } from '../users/schemas/user.schema';
import { WalletsRepository } from '../wallets/repositories/wallets.repository';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { TransactionsRepository } from './repositories/transaction.repository';

@Injectable()
export class TransactionsService {
  constructor(
    @Inject(forwardRef(() => WalletsRepository))
    private transactionsRepository: TransactionsRepository,
    private usersRepository: UsersRepository,
    private walletsRepository: WalletsRepository,
  ) {}

  async getTransactionById(
    transactionId: string,
  ): Promise<TransactionResponseDto> {
    const transaction =
      await this.transactionsRepository.getTransactionById(transactionId);

    if (!transaction) {
      throw new NotFoundException({
        message: 'Transaction not found.',
        status: 404,
        success: false,
      });
    }

    return transaction;
  }

  async getAllUserTransactionByUserId(
    user: JwtUser,
    userId: string,
    queryWithPaginationDto: QueryWithPaginationDto,
  ) {
    const id = new Types.ObjectId(userId);

    if (user.role === Role.USER) {
      if (id !== user.sub) {
        throw new ForbiddenException({
          message: 'Access denied. This transactions does not belong to you.',
          success: false,
          status: 403,
        });
      }
    }

    const userExist = await this.usersRepository.findById(id);

    if (!userExist) {
      throw new NotFoundException({
        message: 'User not found.',
        success: false,
        status: 404,
      });
    }

    const wallet = await this.walletsRepository.findWalletByUserId(
      userExist._id.toString(),
    );

    if (!wallet) {
      throw new NotFoundException({
        message: 'Wallet not found.',
        status: 404,
        success: false,
      });
    }

    const transactions =
      await this.transactionsRepository.getAllUserTransactionsByWalletId(
        wallet._id,
        queryWithPaginationDto,
      );

    if (
      !transactions.transactionObj ||
      transactions.transactionObj.length === 0
    ) {
      throw new NotFoundException({
        message: 'Transactions not found.',
        success: false,
        status: 404,
      });
    }

    return transactions;
  }

  async getAllTransactions(queryWithPaginationDto: QueryWithPaginationDto) {
    const transactions = await this.transactionsRepository.getAllTransactions(
      queryWithPaginationDto,
    );

    if (!transactions) {
      throw new NotFoundException({
        message: 'Transactions not found.',
        status: 404,
        success: false,
      });
    }

    return transactions;
  }
}
