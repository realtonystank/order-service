import express from "express";
import { asyncWrapper } from "../utils";
import { PaymentController } from "./paymentController";
import { createCashFreeGW } from "../common/factories/paymentGwFactory";
import { createMessageBroker } from "../common/factories/brokerFactory";
import logger from "../config/logger";
const router = express.Router();

const cashfree = createCashFreeGW();
const broker = createMessageBroker();
const paymentController = new PaymentController(cashfree, broker, logger);

router.post("/webhook", asyncWrapper(paymentController.handleWebhook));
router.get("/verify", asyncWrapper(paymentController.verifyPayment));

export default router;
