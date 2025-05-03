import mongoose from "mongoose";

export interface ToppingPricingCache {
  _id: mongoose.Types.ObjectId;
  toppingId: string;
  price: string;
  tenantId: string;
}

const toppingCacheSchema = new mongoose.Schema<ToppingPricingCache>({
  toppingId: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
  tenantId: {
    type: String,
    required: true,
  },
});

export default mongoose.model(
  "ToppingPricingCache",
  toppingCacheSchema,
  "toppingCache",
);
