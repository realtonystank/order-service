import toppingCacheModel from "./toppingCacheModel";

export const handleToppingUpdate = async (value: string) => {
  try {
    const topping = JSON.parse(value);
    return await toppingCacheModel.findOneAndUpdate(
      { toppingId: topping.id },
      { $set: { price: topping.price } },
      { upsert: true },
    );
  } catch (err) {
    console.error(err);
  }
};
