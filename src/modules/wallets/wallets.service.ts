import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtUser } from '../../common/types/jwt-user.type';
import { Role } from '../users/schemas/user.schema';
import { WalletsRepository } from './repositories/wallets.repository';

@Injectable()
export class WalletsService {
  constructor(private readonly walletsRepository: WalletsRepository) {}

  async findWalletByUserId(userId: string, user: JwtUser) {
    if (user.role !== Role.ADMIN) {
      if (user.sub.toString() !== userId) {
        throw new ForbiddenException({
          message: 'You can only have access to your own wallet.',
          success: false,
          status: 403,
        });
      }
    }

    const wallet = await this.walletsRepository.findWalletByUserId(userId);

    if (!wallet) {
      throw new NotFoundException({
        message: 'Wallet not found.',
        status: 404,
        success: false,
      });
    }

    return wallet;
  }

  async findWalletById(walletId: string, user: JwtUser) {
    const wallet = await this.walletsRepository.findWalletById(walletId);

    if (!wallet) {
      throw new NotFoundException({
        message: 'Wallet not found.',
        status: 404,
        success: false,
      });
    }

    if (user.role !== Role.ADMIN) {
      if (user.sub.toString() !== wallet.userId.toString()) {
        throw new ForbiddenException({
          message: 'You can only have access to your own wallet.',
          success: false,
          status: 403,
        });
      }
    }

    return wallet;
  }

  async debitWallet(walletId: string, amount: number, user: JwtUser) {
    const walletExist = await this.walletsRepository.findWalletById(walletId);
    if (walletExist?.userId.toString() !== walletId) {
      throw new ForbiddenException({
        message: 'You can only withdraw from your wallet.',
        success: false,
        status: 403,
      });
    }

    if (!walletExist) {
      throw new NotFoundException({
        message: 'Wallet not found.',
        status: 404,
        success: false,
      });
    }

    const dto = {
      walletId,
      amount,
      description: 'Referral Bonus',
    };
    const wallet = await this.walletsRepository.debitWallet(dto);

    return {
      message: 'Payment processed successfully.',
    };
  }

  async getWalletBalance(walletId: string, user: JwtUser) {
    const wallet = await this.walletsRepository.findWalletById(walletId);

    if (!wallet) {
      throw new NotFoundException({
        message: 'Wallet not found.',
        status: 404,
        success: false,
      });
    }

    if (user.role !== Role.ADMIN) {
      if (user.sub.toString() !== wallet.userId.toString()) {
        throw new ForbiddenException({
          message: 'You can only have access to your own wallet.',
          success: false,
          status: 403,
        });
      }
    }

    return wallet.balance;
  }
}
