import { Request, Response } from "express";
import { PaymentGW } from "./paymentTypes";
import orderModel from "../order/orderModel";
import { PaymentStatus } from "../order/orderTypes";
export class PaymentController {
  constructor(private paymentGW: PaymentGW) {}
  handleWebhook = async (req: Request, res: Response) => {
    console.log("webhook body - ", req.body);
    const webhookBody = req.body;
    const allowedWebhookTypes = [
      "PAYMENT_SUCCESS_WEBHOOK",
      "PAYMENT_FAILED_WEBHOOK",
    ];
    if (allowedWebhookTypes.includes(webhookBody.type)) {
      const cashfreeSessionId = webhookBody.data.order.order_id;
      const verifiedSession =
        await this.paymentGW.getSession(cashfreeSessionId);

      console.log("verified session -", verifiedSession);

      const isPaymentSuccess = verifiedSession.paymentStatus === "paid";
      await orderModel.updateOne(
        {
          _id: verifiedSession.metadata.orderId,
        },
        {
          paymentStatus: isPaymentSuccess
            ? PaymentStatus.PAID
            : PaymentStatus.FAILED,
        },
        { new: true },
      );
    }
    res.json({ success: true });
  };
}
