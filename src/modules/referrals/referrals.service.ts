import { ForbiddenException, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { JwtUser } from '../../common/types/jwt-user.type';
import { PaymentsRepository } from '../payments/repositories/payment.repository';
import { TransactionsRepository } from '../transactions/repositories/transaction.repository';
import { UsersRepository } from '../users/repositories/users.repository';
import { Role } from '../users/schemas/user.schema';
import { WalletsRepository } from '../wallets/repositories/wallets.repository';

@Injectable()
export class ReferralsService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly paymentsRepository: PaymentsRepository,
    private readonly walletsRepository: WalletsRepository,
    private readonly transactionsRepository: TransactionsRepository,
  ) {}

  async processReferralReward(userId: string, amount: number) {
    const id = new Types.ObjectId(userId);
    const user = await this.usersRepository.findById(id);

    if (!user?.referralChain?.length) return;

    const levelPercentMap: Record<number, number> = {
      1: 0.15,
      2: 0.075,
      3: 0.025,
    };

    const formattedAmt = amount / 100;

    const referralIds = user.referralChain.map((r) => r.userId);

    const refUsers = await this.usersRepository.findManyByIds(referralIds);

    const refUserMap = new Map(refUsers.map((u) => [u._id.toString(), u]));

    const wallets =
      await this.walletsRepository.findWalletsByUserIds(referralIds);

    const walletMap = new Map(wallets.map((w) => [w.userId.toString(), w]));

    for (const ref of user.referralChain) {
      const percent = levelPercentMap[ref.level];
      if (!percent) continue;

      const refUser = refUserMap.get(ref.userId.toString());
      if (!refUser) continue;

      const wallet = walletMap.get(ref.userId.toString());
      if (!wallet) continue;

      const rewardAmount = formattedAmt * percent;

      const description = `Level ${ref.level} referral bonus from ${user.firstName} ${user.lastName}`;

      await this.walletsRepository.creditWallet({
        walletId: wallet._id.toString(),
        amount: rewardAmount,
        description,
      });
    }
  }

  async getReferralStats(userId: string, user: JwtUser) {
    const userObj = new Types.ObjectId(userId);
    if (user.role !== Role.ADMIN) {
      if (userId !== user.sub.toString()) {
        throw new ForbiddenException({
          message: 'You can only get referral statistics that belong to you.',
          success: false,
          status: 403,
        });
      }
    }

    const totalReferred = await this.usersRepository.countDocuments({
      referredBy: userObj,
    });

    const referredUsers = await this.usersRepository.getThoseThatIReferred({
      referredBy: userObj,
    });

    const referredUserIds = referredUsers.map((u) => u._id);

    const paidUsers =
      await this.paymentsRepository.findPaidReferralsByUserIds(referredUserIds);

    const paidCount = paidUsers.length;

    const unpaidCount = totalReferred - paidCount;

    const totalEarned =
      await this.transactionsRepository.sumReferralEarnings(userObj);

    return {
      totalReferred,
      paidCount,
      unpaidCount,
      totalEarned,
    };
  }

  async getReferralNetwork(userId: string, user: JwtUser) {
    const userObj = new Types.ObjectId(userId);
    if (user.role !== Role.ADMIN) {
      if (userId !== user.sub.toString()) {
        throw new ForbiddenException({
          message: 'You can only get referral statistics that belong to you.',
          success: false,
          status: 403,
        });
      }
    }

    const referrals = await this.usersRepository.getThoseThatIReferred({
    referredBy: userObj,
  });

  return referrals.map(user => ({
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    referralCode: user.referralCode,
    // createdAt: user.createdAt,
  }));
  }

  async getPaidAndUnpaidReferrals(userId: string, user: JwtUser) {
const userObj = new Types.ObjectId(userId);
    if (user.role !== Role.ADMIN) {
      if (userId !== user.sub.toString()) {
        throw new ForbiddenException({
          message: 'You can only get referral statistics that belong to you.',
          success: false,
          status: 403,
        });
      }
    }
  const referrals = await this.usersRepository.getThoseThatIReferred({
    referredBy: userObj,
  });

  const referralIds = referrals.map(r => r._id);

  const paidPayments =
    await this.paymentsRepository.findPaidReferralsByUserIds(
      referralIds,
    );

  const paidUserIds = new Set(
    paidPayments.map(p => p.userId.toString()),
  );

  const paid: any[] = [];
  const unpaid: any[] = [];

  for (const user of referrals) {
    if (paidUserIds.has(user._id.toString())) {
      paid.push(user);
    } else {
      unpaid.push(user);
    }
  }

  return {
    paid,
    unpaid,
    totalPaid: paid.length,
    totalUnpaid: unpaid.length,
  };
}
}
