import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import crypto from 'crypto';
import { Request } from 'express';
import { Types } from 'mongoose';
import { UsersRepository } from 'src/modules/users/repositories/users.repository';
import { WalletsRepository } from 'src/modules/wallets/repositories/wallets.repository';
import { PaymentsRepository } from '../../repositories/payment.repository';
import { PaymentStatus } from '../../schemas/payment.schema';
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

    const metadata = { amount, userId, email, reference };
    const response = await axios.post(
      `${this.baseUrl}/transaction/initialize`,
      {
        email: email,
        amount: amount,
        reference: reference,
        metadata,
      },
      {
        headers: {
          Authorization: `Bearer ${this.secret}`,
        },
      },
    );

    return {
      provider: 'paystack',
      reference: payload.reference,
      providerReference: response.data.data.access_code,
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

    return response.data;
  }

  async handleWebhook(req: Request): Promise<any> {
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
    console.log('webhook event.event:', event.event);
    console.log('webhook event.event.metadata:', event.event.metadata);

    if (event.event === 'charge.success') {
      // GET ACCOUNT USING ACCOUNT ID AND USER ID
      const {
        reference,
        status,
        created_at,
        metadata: { amount, userId, email },
        // authorization: { bank, account_name },
      } = event.data;

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

      if (payment?.status === PaymentStatus.PENDING) {
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

        if (userExist.referredBy) {
          const referredBy = await this.usersRepository.findById(
            userExist.referredBy,
          );

          if (!referredBy) {
            throw new NotFoundException({
              message: 'The person who referred this user is not found.',
              success: false,
              status: 404,
            });
          }

          const wallet = await this.walletsRepository.findWalletByUserId(
            referredBy._id.toString(),
          );
          if (!wallet) {
            throw new NotFoundException({
              message: 'User wallet not found.',
              success: false,
              status: 404,
            });
          }

          const walletId = wallet._id.toString();
          const amount = 0.25 * amt;
          const description = `This is the referral bonus on the payment made by ${`${userExist.firstName} ${userExist.lastName}`} for ${payment.plan} plan.`;

          const input = { walletId, amount, description };
          const update = await this.walletsRepository.creditWallet(input);
        }
      }

      return { message: 'successful' };
    }
  }
}
