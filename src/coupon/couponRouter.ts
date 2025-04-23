import express from "express";
import authenticate from "../common/middleware/authenticate";
import { Roles } from "../common/constants";
import { canAccess } from "../common/middleware/canAccess";
import { CouponController } from "./couponController";
import { CouponService } from "./couponService";
import logger from "../config/logger";
import { asyncWrapper } from "../utils";

const router = express.Router();

const couponService = new CouponService();
const couponController = new CouponController(couponService, logger);

router.post(
  "/",
  authenticate,
  canAccess([Roles.ADMIN, Roles.MANAGER]),
  asyncWrapper(couponController.createCoupon),
);

router.patch(
  "/:id",
  authenticate,
  canAccess([Roles.ADMIN, Roles.MANAGER]),
  asyncWrapper(couponController.updateCoupon),
);

router.get("/", asyncWrapper(couponController.getAllCoupons));

router.delete(
  "/:id",
  authenticate,
  canAccess([Roles.ADMIN, Roles.MANAGER]),
  asyncWrapper(couponController.deleteCoupon),
);

export default router;
