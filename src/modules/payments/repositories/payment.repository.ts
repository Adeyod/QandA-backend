import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QueryWithPaginationDto } from '../../../common/dto/query-with-pagination';
import { generatePaymentReference } from '../../../common/utils/helper';
import { Plan, PLAN_PRICES } from '../../users/schemas/user.schema';
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
  ): Promise<PaymentDocument | null> {
    const payment = await this.paymentModel.findOne({
      providerReference: reference,
      userId,
    });

    return payment;
  }

  async updatePaymentStatusUsingPaymentId(
    paymentId: Types.ObjectId,
    status: PaymentStatus,
  ): Promise<PaymentDocument | null> {
    const paidAt = new Date(Date.now());
    console.log('paidAt:', paidAt);
    const payment = await this.paymentModel.findByIdAndUpdate(
      paymentId,
      {
        status,
        paidAt,
      },
      {
        returnDocument: 'after',
      },
    );

    return payment;
  }

  async existingPendingPaymentUsingUserIdAndPlan(
    userId: Types.ObjectId,
    plan: Plan,
    status: PaymentStatus,
  ): Promise<PaymentDocument | null> {
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
  ): Promise<PaymentDocument | null> {
    const update = await this.paymentModel.findByIdAndUpdate(
      id,
      {
        authorizationUrl: authorizationUrl,
        providerReference: providerReference,
      },
      { returnDocument: 'after' },
    );

    return update;
  }

  async setPendingPaymentToExpired(
    id: Types.ObjectId,
  ): Promise<PaymentDocument | null> {
    const updateStatus = await this.paymentModel.findByIdAndUpdate(
      id,
      { status: PaymentStatus.EXPIRED },
      { returnDocument: 'after' },
    );

    return updateStatus;
  }

  async findSuccessfulPaymentPlan(
    userId: Types.ObjectId,
    plan: Plan,
  ): Promise<PaymentDocument | null> {
    const intent = await this.paymentModel.findOne({
      userId,
      plan,
      status: PaymentStatus.SUCCESSFUL,
      verified: true,
    });

    return intent;
  }

  async getAllPaymentsOfAUserWithUserId(
    userId: Types.ObjectId,
  ): Promise<PaymentDocument[] | null> {
    const payments = await this.paymentModel.find({ userId });
    console.log('payments:', payments);
    return payments;
  }

  async getAllPayments(
    queryWithPaginationsDto: QueryWithPaginationDto,
  ): Promise<{
    paymentObj: PaymentDocument[] | null;
    totalPages: number;
    totalCount: number;
  }> {
    const { page, limit, searchParams } = queryWithPaginationsDto;

    let query = this.paymentModel.find();

    if (searchParams) {
      const regex = new RegExp(searchParams, 'i');

      const isBooleanSearch =
        searchParams.toLowerCase() === 'true' ||
        searchParams.toLowerCase() === 'false';

      query = query.where({
        $or: [
          { plan: { $regex: regex } },
          { provider: { $regex: regex } },
          { status: { $regex: regex } },
          ...(isBooleanSearch
            ? [{ verified: searchParams.toLowerCase() === 'true' }]
            : []),
        ],
      });
    }

    const count = await query.clone().countDocuments();
    let pages = 0;

    if (page !== undefined && limit !== undefined && count !== 0) {
      const offset = (page - 1) * limit;

      query = query.skip(offset).limit(limit);
      pages = Math.ceil(count / limit);

      if (page > pages) {
        throw new NotFoundException({
          message: 'Page not found.',
          success: false,
          status: 404,
        });
      }
    }

    const payments = await query.sort({ createdAt: -1 });

    if (payments.length === 0) {
      throw new NotFoundException({
        message: 'Payments not found.',
        success: false,
        status: 404,
      });
    }

    const response = {
      totalCount: count,
      totalPages: pages,
      paymentObj: payments,
    };

    return response;
  }
}
