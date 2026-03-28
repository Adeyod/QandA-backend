import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { generatePaymentReference } from 'src/common/utils/helper';
import { Plan, PLAN_PRICES } from 'src/modules/users/schemas/user.schema';
import { PaymentResponseDto } from '../dto/payment-response.dto';
import {
  Payment,
  PaymentDocument,
  PaymentProvider,
  PaymentStatus,
} from '../schemas/payment.schema';

type PaymentHandlerInput = {
  reference: string;
  amount: number;
  userId: Types.ObjectId;
};

type PaymentHandler = (data: PaymentHandlerInput) => Promise<any>;

@Injectable()
export class PaymentsRepository {
  constructor(
    @InjectModel(Payment.name)
    private paymentModel: Model<PaymentDocument>,
  ) {}

  async createPaymentIntent(
    userId: Types.ObjectId,
    provider: PaymentProvider,
    plan: Plan,
  ) {
    console.log('plan:', plan);
    const amount = PLAN_PRICES[plan];
    console.log('amount:', amount);
    if (!amount) {
      throw new BadRequestException({
        message: 'Invalid Plan selected.',
        success: false,
        status: 400,
      });
    }

    const payload = {
      plan,
      userId,
    };
    const reference = generatePaymentReference(payload);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    const newPayment = await new this.paymentModel({
      userId,
      plan,
      amount,
      reference,
      provider,
      expiresAt,
    }).save();

    return newPayment;
  }

  async getPaymentByRefAndUserId(
    reference: string,
    userId: Types.ObjectId,
  ): Promise<PaymentResponseDto | null> {
    const payment = await this.paymentModel.findOne({
      providerReference: reference,
      userId,
    });

    return payment;
  }

  async updatePaymentStatusUsingPaymentId(
    paymentId: Types.ObjectId,
    status: PaymentStatus,
  ): Promise<PaymentResponseDto | null> {
    const paidAt = new Date(Date.now());
    console.log('paidAt:', paidAt);
    const payment = await this.paymentModel.findByIdAndUpdate(paymentId, {
      status,
      paidAt,
    });

    return payment;
  }

  async existingPendingPaymentUsingUserIdAndPlan(
    userId: Types.ObjectId,
    plan: Plan,
    status: PaymentStatus,
  ): Promise<PaymentResponseDto | null> {
    const existing = await this.paymentModel.findOne({
      userId,
      plan,
      status,
      expiresAt: { $gt: new Date() },
    });

    return existing;
  }

  async updateIntentWithAuthUrl(
    id: Types.ObjectId,
    authorizationUrl: string,
    providerReference: string,
  ): Promise<PaymentResponseDto | null> {
    const update = await this.paymentModel.findByIdAndUpdate(
      id,
      {
        authorizationUrl: authorizationUrl,
        providerReference: providerReference,
      },
      { new: true },
    );

    return update;
  }

  async setPendingPaymentToExpired(
    id: Types.ObjectId,
  ): Promise<PaymentResponseDto | null> {
    const updateStatus = await this.paymentModel.findByIdAndUpdate(
      id,
      { status: PaymentStatus.EXPIRED },
      { new: true },
    );

    return updateStatus;
  }

  async findSuccessfulPaymentPlan(
    id: Types.ObjectId,
    plan: Plan,
  ): Promise<PaymentResponseDto | null> {
    const intent = await this.paymentModel.findOne({
      _id: id,
      plan: plan,
      status: PaymentStatus.SUCCESSFUL,
    });

    return intent;
  }
}
