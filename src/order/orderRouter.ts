import express from "express";
import authenticate from "../common/middleware/authenticate";
import { asyncWrapper } from "../utils";
import { OrderController } from "./orderController";
import orderCreateValidator from "./order-create-validator";

const router = express.Router();
const orderController = new OrderController();

router.post(
  "/",
  authenticate,
  orderCreateValidator,
  asyncWrapper(orderController.create),
);

export default router;
