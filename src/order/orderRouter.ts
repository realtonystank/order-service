import express from "express";
import authenticate from "../common/middleware/authenticate";
import { asyncWrapper } from "../utils";
import { OrderController } from "./orderController";
import orderCreateValidator from "./order-create-validator";
import { createCashFreeGW } from "../common/factories/paymentGwFactory";
import { createMessageBroker } from "../common/factories/brokerFactory";

const router = express.Router();
const cashfree = createCashFreeGW();
const broker = createMessageBroker();
const orderController = new OrderController(cashfree, broker);

router.post(
  "/",
  authenticate,
  orderCreateValidator,
  asyncWrapper(orderController.create),
);

export default router;
