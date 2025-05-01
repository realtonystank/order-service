import productCacheModel from "./productCacheModel";

export const handleProductUpdate = async (value: string) => {
  try {
    const product = JSON.parse(value);
    return await productCacheModel.updateOne(
      {
        productId: product.id,
      },
      { $set: { priceConfiguration: product.priceConfiguration } },
      { upsert: true },
    );
  } catch (err) {
    console.error(err);
  }
};
