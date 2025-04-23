import couponModel from "./couponModel";
import { Coupon } from "./couponTypes";

export class CouponService {
  createCoupon = (couponData: Coupon) => {
    const newCoupon = new couponModel(couponData);
    return newCoupon.save();
  };
}
