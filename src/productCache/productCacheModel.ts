import mongoose from "mongoose";

export interface ProductPricingCache {
  productId: string;
  priceConfiguration: {
    priceType: "base" | "additional";
    availableOptions: {
      [key: string]: number;
    };
  };
}

const priceSchema = new mongoose.Schema({
  priceType: {
    type: String,
    enum: ["base", "additionla"],
  },
  availableOptions: {
    type: Object,
    of: Number,
  },
});

const productCacheSchema = new mongoose.Schema<ProductPricingCache>({
  productId: {
    type: String,
    required: true,
  },
  priceConfiguration: {
    type: Object,
    of: priceSchema,
  },
});

export default mongoose.model(
  "ProductPricingCache",
  productCacheSchema,
  "productCache",
);
