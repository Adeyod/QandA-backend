import { Request } from 'express';

export interface PaymentInitializationPayload {
  email: string;
  amount: number;
  reference: string;
  userId: string;
}

export interface PaymentProviderResponse {
  paymentUrl: string;
  reference: string;
  provider: string;
  providerReference: string;
}

export interface IPaymentProvider {
  initializePayment(
    payload: PaymentInitializationPayload,
  ): Promise<PaymentProviderResponse>;

  verifyPayment(reference: string): Promise<any>;

  handleWebhook(req: Request): Promise<any>;
}
