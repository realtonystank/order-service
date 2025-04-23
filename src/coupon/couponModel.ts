import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    discount: {
      type: Number,
      required: true,
    },
    validUpto: {
      type: Date,
      required: true,
    },
    tenant: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Coupon", couponSchema);
