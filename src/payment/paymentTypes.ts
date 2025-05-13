interface PaymentOptions {
  currency?: "INR";
  amount: number;
  orderId: string;
  tenantId: string;
  idempotencyKey?: string;
}

export interface ExtendedPaymentOptions extends PaymentOptions {
  cashfreeOrderId: string;
}

export type GatewayPaymentStatus = "no_payment_required" | "paid" | "unpaid";

export interface PaymentSession {
  id: string;
  paymentUrl: string;
  paymentStatus: GatewayPaymentStatus;
}

interface CustomMetadata {
  orderId: string;
}

export interface VerifiedSession {
  id: string;
  metadata: CustomMetadata;
  paymentStatus: GatewayPaymentStatus;
}

export interface PaymentGW {
  createSession: (options: ExtendedPaymentOptions) => Promise<PaymentSession>;

  getSession: (id: string) => Promise<VerifiedSession>;
}
