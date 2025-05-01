import mongoose from "mongoose";

interface ToppingPricingCache {
  toppingId: string;
  price: string;
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
});

export default mongoose.model(
  "ToppingPricingCache",
  toppingCacheSchema,
  "toppingCache",
);
