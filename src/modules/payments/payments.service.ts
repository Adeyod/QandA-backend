import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { Types } from 'mongoose';
import { QueryWithPaginationDto } from 'src/common/dto/query-with-pagination';
import { JwtUser } from 'src/common/types/jwt-user.type';
import { UsersRepository } from '../users/repositories/users.repository';
import { Plan, Role } from '../users/schemas/user.schema';
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

    return await handler.handleWebhook(req);
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
