import express from "express";
import { asyncWrapper } from "../utils";
import { PaymentController } from "./paymentController";
import { createCashFreeGW } from "../common/factories/paymentGwFactory";
const router = express.Router();

const cashfree = createCashFreeGW();
const paymentController = new PaymentController(cashfree);

router.post("/webhook", asyncWrapper(paymentController.handleWebhook));

export default router;
