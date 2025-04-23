import { NextFunction, Request, Response } from "express";
import { Logger } from "winston";
import { CouponService } from "./couponService";
import createHttpError from "http-errors";
import { Roles } from "../common/constants";
import { AuthRequest } from "../types";

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
}
