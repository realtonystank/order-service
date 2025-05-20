import express from "express";
import authenticate from "../common/middleware/authenticate";
import { asyncWrapper } from "../utils";
import { OrderController } from "./orderController";
import orderCreateValidator from "./order-create-validator";
import { createCashFreeGW } from "../common/factories/paymentGwFactory";
import { createMessageBroker } from "../common/factories/brokerFactory";
import logger from "../config/logger";

const router = express.Router();
const cashfree = createCashFreeGW();
const broker = createMessageBroker();
const orderController = new OrderController(cashfree, broker, logger);

router.post(
  "/",
  authenticate,
  orderCreateValidator,
  asyncWrapper(orderController.create),
);
router.get("/mine", authenticate, asyncWrapper(orderController.getMine));
router.get("/:orderId", authenticate, asyncWrapper(orderController.getSingle));
router.get("/", authenticate, asyncWrapper(orderController.getAll));
router.patch(
  "/change-status/:orderId",
  authenticate,
  asyncWrapper(orderController.changeStatus),
);

export default router;
