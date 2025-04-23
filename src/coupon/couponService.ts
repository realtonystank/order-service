import mongoose from "mongoose";
import couponModel from "./couponModel";
import { Coupon } from "./couponTypes";

export class CouponService {
  createCoupon = (couponData: Coupon) => {
    const newCoupon = new couponModel(couponData);
    return newCoupon.save();
  };

  getCouponById = (couponId: mongoose.Types.ObjectId) => {
    return couponModel.findById(couponId);
  };

  updateCouponById = (
    couponId: mongoose.Types.ObjectId,
    couponData: Coupon,
  ) => {
    return couponModel.findOneAndUpdate({ _id: couponId }, couponData, {
      new: true,
    });
  };
}
