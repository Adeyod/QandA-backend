import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { JwtUser } from '../../common/types/jwt-user.type';
import { UsersRepository } from '../users/repositories/users.repository';
import { Plan, Role } from '../users/schemas/user.schema';
import { WalletsRepository } from '../wallets/repositories/wallets.repository';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { IPaymentProvider } from './providers/interfaces/provider.interface';
import { PaystackService } from './providers/paystack/paystack.service';
import { PaymentsRepository } from './repositories/payment.repository';
import { PaymentProvider, PaymentStatus } from './schemas/payment.schema';

@Injectable()
export class PaymentsService {
  private providerMap: Record<PaymentProvider, IPaymentProvider>;

  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly walletsRepository: WalletsRepository,
    private readonly paystackService: PaystackService,
    // private readonly flutterwaveService: flutterwaveService,
    private usersRepository: UsersRepository,
  ) {
    this.providerMap = {
      [PaymentProvider.PAYSTACK]: this.paystackService,
      // [PaymentProvider.FLUTTERWAVE]: this.flutterwaveService
    };
  }

  async createPaymentIntent(
    provider: PaymentProvider,
    plan: Plan,
    user: JwtUser,
  ) {
    const findUser = await this.usersRepository.findById(user.sub);

    if (!findUser) {
      throw new NotFoundException({
        message: 'User not found.',
        success: false,
        status: 404,
      });
    }

    const alreadyPaid = await this.paymentsRepository.findSuccessfulPaymentPlan(
      findUser._id,
      plan,
    );

    if (alreadyPaid) {
      throw new UnauthorizedException({
        message: 'Plan already purchased.',
        success: false,
        status: 401,
      });
    }

    const status = PaymentStatus.PENDING;

    const findIntent =
      await this.paymentsRepository.existingPendingPaymentUsingUserIdAndPlan(
        findUser._id,
        plan,
        status,
      );

    if (findIntent) {
      if (findIntent.expiresAt < new Date()) {
        await this.paymentsRepository.setPendingPaymentToExpired(
          findIntent._id,
        );
      } else if (findIntent.provider === provider) {
        return {
          provider: findIntent.provider,
          reference: findIntent.reference,
          paymentUrl: findIntent.authorizationUrl,
        };
      } else {
        await this.paymentsRepository.setPendingPaymentToExpired(
          findIntent._id,
        );
      }
    }
    const createIntent = await this.paymentsRepository.createPaymentIntent(
      findUser._id,
      provider,
      plan,
    );

    if (!createIntent) {
      throw new BadRequestException({
        message: 'Unable to create payment document',
        success: false,
        status: 400,
      });
    }

    const handler = this.providerMap[provider];

    if (!handler) {
      throw new BadRequestException({
        message: 'Unsupported provider.',
        success: false,
        status: 400,
      });
    }

    const providerResponse = await handler.initializePayment({
      email: user.email,
      amount: createIntent.amount * 100,
      reference: createIntent.reference,
      userId: findUser._id.toString(),
    });

    const updateIntent = await this.paymentsRepository.updateIntentWithAuthUrl(
      createIntent._id,
      providerResponse.paymentUrl,
      providerResponse.providerReference,
    );
    return providerResponse;
  }

  async handleWebhook(provider: PaymentProvider, req: Request) {
    const handler = this.providerMap[provider];

    if (!handler) {
      throw new BadRequestException({
        message: 'Unsupported provider.',
        success: false,
        status: 400,
      });
    }

    const providerResponse = await handler.handleWebhook(req);

    if (providerResponse.event !== 'charge.success') {
      return { message: 'Payment not successful.' };
    }

    if (providerResponse.event === 'charge.success') {
      // GET ACCOUNT USING ACCOUNT ID AND USER ID
      const {
        reference,
        status,
        created_at,
        metadata: { amount, userId, email },
        // authorization: { bank, account_name },
      } = providerResponse.data;

      const amt = parseFloat(amount.toString().replace(/,/g, ''));

      if (isNaN(amt)) {
        throw new BadRequestException({
          message: 'Invalid amount provided. Please provide a valid number',
          status: 400,
          success: false,
        });
      }

      const user = new Types.ObjectId(userId);

      const payment = await this.paymentsRepository.getPaymentByRefAndUserId(
        reference,
        user,
      );

      if (!payment) {
        throw new NotFoundException({
          message: 'Payment document not found.',
          status: 404,
          success: false,
        });
      }

      if (payment.verified) {
        return { message: 'Payment already processed.' };
      }

      const verifyResponse = await handler.verifyPayment(reference);

      const {
        status: _status,
        reference: _ref,
        amount: _amt,
        metadata: {
          email: _email,
          amount: _amount,
          reference: _reference,
          userId: _userId,
        },
      } = verifyResponse;

      if (_status === 'success') {
        payment.verified = true;
        if (payment.status === PaymentStatus.PENDING) {
          const paymentUpdateRes =
            await this.paymentsRepository.updatePaymentStatusUsingPaymentId(
              payment._id,
              PaymentStatus.SUCCESSFUL,
            );

          if (!paymentUpdateRes) {
            throw new BadRequestException({
              message: 'Unable to process payment webhook.',
              success: false,
              status: 400,
            });
          }

          const userExist = await this.usersRepository.findById(user);
          if (!userExist) {
            throw new NotFoundException({
              message: 'User not found.',
              success: false,
              status: 404,
            });
          }

          userExist.plans.push(payment.plan);

          if (userExist.referralChain && userExist.referralChain.length > 0) {
            const levelPercentMap: Record<number, number> = {
              1: 0.15,
              2: 0.075,
              3: 0.025,
            };

            const formattedAmt = amount / 100;

            for (const ref of userExist.referralChain) {
              const percent = levelPercentMap[ref.level];

              if (!percent) {
                continue;
              }

              const refUser = await this.usersRepository.findById(ref.userId);

              if (!refUser) {
                console.log(
                  'I can not find ref user so i am continuing the rest.',
                );
                continue;
              }

              const wallet = await this.walletsRepository.findWalletByUserId(
                refUser._id.toString(),
              );

              if (!wallet) {
                console.log(
                  'I can not find wallet of this user so i am continuing the rest.',
                );
                continue;
              }

              const rewardAmount = formattedAmt * percent;

              const description = `Level ${ref.level} referral bonus from ${userExist.firstName} ${userExist.lastName}`;

              const rewarded = await this.walletsRepository.creditWallet({
                walletId: wallet._id.toString(),
                amount: rewardAmount,
                description,
              });
            }
          }

          await userExist.save();
        }
        await payment.save();
      }

      return { message: 'successful' };
    }
  }

  async verifyPayment(reference: string, user: JwtUser) {
    // 1️⃣ CHECK DB FIRST (faster + avoids unnecessary provider calls)
    const transaction =
      await this.paymentsRepository.findPaymentTransactionByReference(
        reference,
      );

    if (!transaction) {
      throw new NotFoundException({
        message: 'Transaction not found.',
        success: false,
        status: 404,
      });
    }

    // Ownership check
    if (transaction.userId.toString() !== user.sub.toString()) {
      throw new ForbiddenException({
        message: 'You are not authorized to access this transaction.',
        success: false,
        status: 403,
      });
    }

    // 2️⃣ IDEMPOTENCY CHECK (webhook might have already processed it)
    if (transaction.status === 'SUCCESSFUL') {
      return {
        message: 'Payment already verified.',
        success: true,
        status: 200,
        data: transaction,
      };
    }

    const provider = transaction.provider;
    const handler = this.providerMap[provider];

    if (!handler) {
      throw new BadRequestException({
        message: 'Unsupported provider.',
        success: false,
        status: 400,
      });
    }

    // 3️⃣ VERIFY WITH PROVIDER (fallback if webhook hasn't hit yet)
    const providerRes = await handler.verifyPayment(reference);

    if (!providerRes || providerRes.status !== 'success') {
      throw new BadRequestException({
        message: 'Payment not successful yet.',
        success: false,
        status: 400,
      });
    }

    // 4️⃣ VALIDATE DATA INTEGRITY
    if (transaction.amount !== providerRes.amount) {
      throw new BadRequestException({
        message: 'Payment details mismatch.',
        success: false,
        status: 400,
      });
    }

    // 5️⃣ ONLY UPDATE STATUS (DO NOT CALL BUSINESS LOGIC)
    transaction.status = PaymentStatus.SUCCESSFUL;
    // transaction.providerResponse = providerRes;

    await transaction.save();

    return {
      message: 'Payment verified successfully.',
      success: true,
      status: 200,
      provider: transaction?.provider,
    };
  }

  async getAllPaymentsOfAUserByUserId(
    user: JwtUser,
    userId: string,
  ): Promise<PaymentResponseDto[]> {
    const { sub, role } = user;

    if (role !== Role.ADMIN) {
      if (sub.toString() !== userId) {
        throw new UnauthorizedException({
          message: 'You can only access your payments.',
          success: false,
          status: 401,
        });
      }
    }

    const id = new Types.ObjectId(userId);
    const payments =
      await this.paymentsRepository.getAllPaymentsOfAUserWithUserId(id);

    if (!payments) {
      throw new NotFoundException({
        message: 'No payment found for this user',
        success: false,
        status: 404,
      });
    }
    return payments;
  }

  async getAllPayments(queryWithPaginationDto: QueryWithPaginationDto) {
    const payments = await this.paymentsRepository.getAllPayments(
      queryWithPaginationDto,
    );

    if (!payments.paymentObj || payments.paymentObj.length === 0) {
      throw new NotFoundException({
        message: 'Payments not found.',
        success: false,
        status: 404,
      });
    }

    return payments;
  }
}
