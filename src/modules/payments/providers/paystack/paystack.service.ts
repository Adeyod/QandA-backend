import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import crypto from 'crypto';
import { Request } from 'express';
import { UsersRepository } from '../../../../modules/users/repositories/users.repository';
import { WalletsRepository } from '../../../../modules/wallets/repositories/wallets.repository';
import { PaymentsRepository } from '../../repositories/payment.repository';
import {
  IPaymentProvider,
  PaymentInitializationPayload,
} from '../interfaces/provider.interface';

@Injectable()
export class PaystackService implements IPaymentProvider {
  private readonly baseUrl = 'https://api.paystack.co';
  private readonly secret = process.env.PAYSTACK_TEST_SECRET_KEY;
  constructor(
    private paymentsRepository: PaymentsRepository,
    private usersRepository: UsersRepository,
    private walletsRepository: WalletsRepository,
    private configService: ConfigService,
  ) {
    this.secret = this.configService.get<string>('PAYSTACK_TEST_SECRET_KEY');
  }

  async initializePayment(payload: PaymentInitializationPayload) {
    const { amount, userId, email, reference } = payload;

    const dataToSend = {
      email: email,
      amount,
      metadata: payload,
    };
    const response = await axios.post(
      `${this.baseUrl}/transaction/initialize`,
      dataToSend,
      {
        headers: {
          Authorization: `Bearer ${this.secret}`,
        },
      },
    );

    return {
      provider: 'paystack',
      reference: payload.reference,
      providerReference: response.data.data.reference,
      paymentUrl: response.data.data.authorization_url,
    };
  }

  async verifyPayment(reference: string): Promise<any> {
    const response = await axios.get(
      `${this.baseUrl}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${this.secret as string}`,
        },
      },
    );

    return response.data.data;
  }

  handleWebhook(req: Request): Promise<any> {
    const hash = crypto
      .createHmac('sha512', this.secret as string)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      throw new UnauthorizedException({
        message: 'Invalid signature.',
        success: false,
        status: 401,
      });
    }

    const event = req.body;
    return event;
    // console.log('webhook event.event:', event);
    // console.log('webhook event.metadata:', event.metadata);

    // if (event.event !== 'charge.success') return;

    // if (event.event === 'charge.success') {
    //   // GET ACCOUNT USING ACCOUNT ID AND USER ID
    //   const {
    //     reference,
    //     status,
    //     created_at,
    //     metadata: { amount, userId, email },
    //     // authorization: { bank, account_name },
    //   } = event.data;

    //   const amt = parseFloat(amount.toString().replace(/,/g, ''));

    //   if (isNaN(amt)) {
    //     throw new BadRequestException({
    //       message: 'Invalid amount provided. Please provide a valid number',
    //       status: 400,
    //       success: false,
    //     });
    //   }

    //   const user = new Types.ObjectId(userId);

    //   const payment = await this.paymentsRepository.getPaymentByRefAndUserId(
    //     reference,
    //     user,
    //   );

    //   if (!payment) {
    //     throw new NotFoundException({
    //       message: 'Payment document not found.',
    //       status: 404,
    //       success: false,
    //     });
    //   }

    //   if (payment.verified) {
    //     return { message: 'Payment already processed.' };
    //   }

    //   const verifyResponse = await this.verifyPayment(reference);

    //   const {
    //     status: _status,
    //     reference: _ref,
    //     amount: _amt,
    //     metadata: {
    //       email: _email,
    //       amount: _amount,
    //       reference: _reference,
    //       userId: _userId,
    //     },
    //   } = verifyResponse;

    //   if (_status === 'success') {
    //     payment.verified = true;
    //     if (payment.status === PaymentStatus.PENDING) {
    //       const paymentUpdateRes =
    //         await this.paymentsRepository.updatePaymentStatusUsingPaymentId(
    //           payment._id,
    //           PaymentStatus.SUCCESSFUL,
    //         );

    //       if (!paymentUpdateRes) {
    //         throw new BadRequestException({
    //           message: 'Unable to process payment webhook.',
    //           success: false,
    //           status: 400,
    //         });
    //       }

    //       const userExist = await this.usersRepository.findById(user);
    //       if (!userExist) {
    //         throw new NotFoundException({
    //           message: 'User not found.',
    //           success: false,
    //           status: 404,
    //         });
    //       }

    //       userExist.plans.push(payment.plan);

    //       if (userExist.referralChain && userExist.referralChain.length > 0) {
    //         const levelPercentMap: Record<number, number> = {
    //           1: 0.15,
    //           2: 0.075,
    //           3: 0.025,
    //         };

    //         const formattedAmt = amount / 100;

    //         for (const ref of userExist.referralChain) {
    //           const percent = levelPercentMap[ref.level];

    //           if (!percent) {
    //             continue;
    //           }

    //           const refUser = await this.usersRepository.findById(ref.userId);

    //           if (!refUser) {
    //             console.log(
    //               'I can not find ref user so i am continuing the rest.',
    //             );
    //             continue;
    //           }

    //           const wallet = await this.walletsRepository.findWalletByUserId(
    //             refUser._id.toString(),
    //           );

    //           if (!wallet) {
    //             console.log(
    //               'I can not find wallet of this user so i am continuing the rest.',
    //             );
    //             continue;
    //           }

    //           const rewardAmount = formattedAmt * percent;

    //           const description = `Level ${ref.level} referral bonus from ${userExist.firstName} ${userExist.lastName}`;

    //           const rewarded = await this.walletsRepository.creditWallet({
    //             walletId: wallet._id.toString(),
    //             amount: rewardAmount,
    //             description,
    //           });
    //         }
    //       }

    //       await userExist.save();
    //     }
    //     await payment.save();
    //   }

    //   return { message: 'successful' };
    // }
  }
}
