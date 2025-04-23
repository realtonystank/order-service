import { NextFunction, Request, Response } from "express";
import { Logger } from "winston";
import { CouponService } from "./couponService";
import createHttpError from "http-errors";
import { Roles } from "../common/constants";
import { AuthRequest } from "../types";
import mongoose from "mongoose";

export class CouponController {
  constructor(
    private couponService: CouponService,
    private logger: Logger,
  ) {}

  createCoupon = async (req: Request, res: Response, next: NextFunction) => {
    const { title, code, discount, validUpto, tenantId } = req.body;

    this.logger
      .info(`Received request to create a new coupon with following data:
      
          title     : ${title}
          code      : ${code}
          discount  : ${discount}
          validUpto : ${validUpto}
          tenant    : ${tenantId}
      `);

    if (isNaN(Number(discount)) || isNaN(Number(tenantId))) {
      next(createHttpError(400, "Please check the number type fields again."));
      return;
    }
    const _req = req as AuthRequest;
    const userRole = _req.auth.role;
    if (userRole === Roles.MANAGER) {
      const userTenant = _req.auth.tenant;
      if (userTenant !== tenantId) {
        next(createHttpError(403, "Forbidden."));
        return;
      }
    }

    const couponData = {
      title,
      code,
      discount: Number(discount),
      validUpto: new Date(validUpto),
      tenant: Number(tenantId),
    };

    const coupon = await this.couponService.createCoupon(couponData);

    this.logger.info(`Coupon created successfully with id: ${coupon._id}`);

    return res.status(201).json(coupon);
  };

  updateCoupon = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      next(createHttpError(400, "Coupon id is not in correct format"));
      return;
    }

    this.logger.info(`Received request to update coupon with id: ${id}`);

    const _req = req as AuthRequest;
    const userRole = _req.auth.role;
    const userTenant = _req.auth.tenant;

    const oldCouponData = await this.couponService.getCouponById(
      id as unknown as mongoose.Types.ObjectId,
    );

    if (
      userRole === Roles.MANAGER &&
      oldCouponData.tenant !== Number(userTenant)
    ) {
      next(createHttpError(403, "Forbidden!"));
      return;
    }

    if (!oldCouponData) {
      next(createHttpError(404, "Coupon with given id not found."));
      return;
    }

    const { title, code, discount, validUpto, tenantId } = req.body;

    const updatedCouponData = {
      title: title ? title : oldCouponData.title,
      code: code ? code : oldCouponData.code,
      discount: discount ? Number(discount) : oldCouponData.discount,
      validUpto: validUpto ? new Date(validUpto) : oldCouponData.validUpto,
      tenant: tenantId ? Number(tenantId) : oldCouponData.tenant,
    };

    const updatedCoupon = await this.couponService.updateCouponById(
      id as unknown as mongoose.Types.ObjectId,
      updatedCouponData,
    );

    this.logger.info(`Updated coupon with id :${id}`);

    res.json(updatedCoupon);
  };

  getAllCoupons = async (req: Request, res: Response) => {
    this.logger.info("Received request to fetch all coupons");
    const coupons = await this.couponService.fetchAllCoupons();

    return res.json(coupons);
  };

  deleteCoupon = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      next(createHttpError(400, "Coupon id is not in correct format"));
      return;
    }

    this.logger.info(`Received request to delete coupon by id: ${id}`);

    const coupon = await this.couponService.getCouponById(
      id as unknown as mongoose.Types.ObjectId,
    );

    if (!coupon) {
      next(createHttpError(404, "Coupon with given id not found."));
      return;
    }

    const _req = req as AuthRequest;
    const userRole = _req.auth.role;
    const userTenant = _req.auth.tenant;

    if (userRole === Roles.MANAGER && coupon.tenant !== Number(userTenant)) {
      next(createHttpError(403, "Forbidden."));
      return;
    }

    this.logger.info(`Found coupon with given id`);

    await this.couponService.deleteCouponById(
      id as unknown as mongoose.Types.ObjectId,
    );

    this.logger.info(`Coupon with id: ${id} deleted successfully.`);

    res.status(204).json({ message: "success" });
  };

  verify = async (req: Request, res: Response, next: NextFunction) => {
    const { code, tenantId } = req.body;

    if (!code || !tenantId) {
      next(createHttpError(400, "coupon code or tenant id is missing"));
      return;
    }

    const coupon = await this.couponService.findCouponFromCodeAndTenant(
      code,
      Number(tenantId),
    );

    if (!coupon) {
      next(createHttpError(404, "Coupon does not exist"));
      return;
    }

    const currentDate = new Date();
    const couponDate = coupon.validUpto;

    if (currentDate <= couponDate) {
      return res.json({ valid: true, discount: coupon.discount });
    }

    return res.json({ valid: false, discount: 0 });
  };
}
