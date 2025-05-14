import express from "express";
import { asyncWrapper } from "../utils";
import { PaymentController } from "./paymentController";
import { createCashFreeGW } from "../common/factories/paymentGwFactory";
import { createMessageBroker } from "../common/factories/brokerFactory";
const router = express.Router();

const cashfree = createCashFreeGW();
const broker = createMessageBroker();
const paymentController = new PaymentController(cashfree, broker);

router.post("/webhook", asyncWrapper(paymentController.handleWebhook));

export default router;
