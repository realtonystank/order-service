import { Request, Response } from "express";
import { PaymentGW } from "./paymentTypes";
import orderModel from "../order/orderModel";
import { PaymentStatus } from "../order/orderTypes";
import { MessageBroker } from "../types/broker";
import { Logger } from "winston";
import { OrderEvents } from "../types";
export class PaymentController {
  constructor(
    private paymentGW: PaymentGW,
    private broker: MessageBroker,
    private logger: Logger,
  ) {}
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
      const updatedOrder = await orderModel.findOneAndUpdate(
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

      const brokerMessage = {
        event_type: OrderEvents.PAYMENT_STATUS_UPDATE,
        data: updatedOrder,
      };

      await this.broker.sendMessage(
        "order",
        JSON.stringify(brokerMessage),
        updatedOrder._id.toString(),
      );
    }
    res.json({ success: true });
  };
  verifyPayment = async (req: Request, res: Response) => {
    const { order_id } = req.query;
    this.logger.info(
      `Receieved request to verify payment with order id - ${order_id}`,
    );
    const verifiedSession = await this.paymentGW.getSession(
      order_id as unknown as string,
    );

    return res.json(verifiedSession);
  };
}
