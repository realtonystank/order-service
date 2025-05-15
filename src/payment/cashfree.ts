import { Cashfree, CFEnvironment, CreateOrderRequest } from "cashfree-pg";
import {
  PaymentGW,
  ExtendedPaymentOptions,
  PaymentSession,
  VerifiedSession,
  GatewayPaymentStatus,
} from "./paymentTypes";
import config from "config";

export class CashFreeGW implements PaymentGW {
  private cashfree: Cashfree;
  constructor() {
    this.cashfree = new Cashfree(
      CFEnvironment.SANDBOX,
      config.get("cashfree.clientId"),
      config.get("cashfree.clientSecret"),
    );
  }
  async createSession(
    options: ExtendedPaymentOptions,
  ): Promise<PaymentSession> {
    console.log("Inside createSession.");
    const requestPaylod: CreateOrderRequest = {
      order_id: options.cashfreeOrderId,
      order_amount: options.amount,
      order_currency: options.currency || "INR",
      customer_details: {
        customer_id: "12413451345",
        customer_email: "test@test.com",
        customer_phone: "9823252342",
      },
      order_meta: {
        return_url: `${config.get("client.url")}/payment?order_id=${options.cashfreeOrderId}&restaurantId=${options.tenantId}`,
        // payment_methods: "cc,dc",
      },
      order_tags: {
        tenant_id: options.tenantId,
        order_id: options.orderId,
      },
    };

    console.log("request payload is - ", requestPaylod);
    console.log("just before creating order with PGCreateOrder");
    const xReqId = undefined;
    const idempotencyKey = options.idempotencyKey;
    try {
      const session = await this.cashfree.PGCreateOrder(
        requestPaylod,
        xReqId,
        idempotencyKey,
      );
      console.log("session is -> ", session);

      return {
        id: session.data.payment_session_id,
        paymentUrl: "testing",
        paymentStatus: "unpaid",
      };
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  async getSession(id: string) {
    const session = await this.cashfree.PGFetchOrder(id);
    const verifiedSession: VerifiedSession = {
      id: session.data.order_id,
      paymentStatus: this.mapStatus(session.data.order_status),
      metadata: {
        orderId: session.data.order_tags.order_id,
      },
    };
    return verifiedSession;
  }

  private mapStatus(status: string): GatewayPaymentStatus {
    switch (status.toUpperCase()) {
      case "PAID":
        return "paid";
      case "ACTIVE":
      case "PENDING":
        return "unpaid";
      default:
        return "unpaid";
    }
  }
}
