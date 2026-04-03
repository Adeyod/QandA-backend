import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { JwtUser } from '../../common/types/jwt-user.type';
import { Role } from '../users/schemas/user.schema';
import { CreateAccountDto } from './dtos/create-account.dto';
import { AccountsRepository } from './repositories/account.repository';

@Injectable()
export class AccountsService {
  constructor(private accountsRepository: AccountsRepository) {}

  async createAccount(user: JwtUser, createAccountDto: CreateAccountDto) {
    const userId = new Types.ObjectId(user.sub);

    const existingAccount =
      await this.accountsRepository.getUserAccount(userId);

    if (existingAccount) {
      throw new ConflictException({
        message: 'User already has an account.',
        success: false,
        status: 409,
      });
    }
    return await this.accountsRepository.createAccount(
      userId,
      createAccountDto,
    );
  }

  async getUserAccount(user: JwtUser, userId: string) {
    const { sub, role } = user;

    if (role === Role.USER) {
      if (sub.toString() !== userId) {
        throw new UnauthorizedException({
          message: 'You can only access your personal account.',
          success: false,
          status: 401,
        });
      }
    }

    const id = new Types.ObjectId(userId);
    const account = await this.accountsRepository.getUserAccount(id);
    console.log('account:', account);

    if (!account) {
      throw new NotFoundException({
        message: 'Account not found.',
        status: 404,
        success: false,
      });
    }

    return account;
  }

  async getAllAccounts(queryWithPaginationDto: QueryWithPaginationDto) {
    return await this.accountsRepository.getAllAccount(queryWithPaginationDto);
  }
}
