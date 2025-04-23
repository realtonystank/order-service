export interface Coupon {
  title: string;
  code: string;
  discount: number;
  validUpto: Date;
  tenant: number;
}
