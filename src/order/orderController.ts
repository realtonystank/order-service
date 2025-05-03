import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";
import { CartItem, Topping } from "../types";
import productCacheModel, {
  ProductPricingCache,
} from "../productCache/productCacheModel";
import toppingCacheModel, {
  ToppingPricingCache,
} from "../toppingCache/toppingCacheModel";
import couponModel from "../coupon/couponModel";
export class OrderController {
  create = async (req: Request, res: Response, next: NextFunction) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      next(createHttpError(400, result.array()[0].msg));
      return;
    }

    const totalPrice = await this.calculateTotal(req.body.cart);

    let discountPercentage = 0;
    const tenantId = req.body.tenantId;
    const couponCode = req.body.couponCode;
    if (couponCode) {
      discountPercentage = await this.getDicountPercentage(
        couponCode,
        tenantId,
      );
    }

    const discountAmount = Math.round((totalPrice * discountPercentage) / 100);

    const priceAfterDiscount = totalPrice - discountAmount;

    const TAXES_PERCENT = 18;

    const taxes = Math.round((priceAfterDiscount * TAXES_PERCENT) / 100);

    return res.json({ totalPrice, discountAmount, taxes });
  };

  private calculateTotal = async (cart: CartItem[]) => {
    const productIds = cart.map((item) => item._id);

    const productPricing = await productCacheModel.find({
      productId: {
        $in: productIds,
      },
    });

    const cartToppingIds = cart.reduce((acc, item) => {
      return [
        ...acc,
        ...item.chosenConfiguration.selectedToppings.map(
          (topping) => topping.id,
        ),
      ];
    }, []);

    const toppingPricing = await toppingCacheModel.find({
      toppingId: {
        $in: cartToppingIds,
      },
    });

    const totalPrice = cart.reduce((acc, item) => {
      const cachedProductPrice = productPricing.find(
        (product) => product.productId === item._id,
      );

      return (
        acc +
        item.qty * this.getItemTotal(item, cachedProductPrice, toppingPricing)
      );
    }, 0);

    return totalPrice;
  };

  private getItemTotal = (
    item: CartItem,
    cachedProductPrice: ProductPricingCache,
    toppingPricing: ToppingPricingCache[],
  ) => {
    const toppingsTotal = item.chosenConfiguration.selectedToppings.reduce(
      (acc, item) => {
        return acc + this.getCurrentToppingPrice(item, toppingPricing);
      },
      0,
    );

    const productTotal = Object.entries(
      item.chosenConfiguration.priceConfiguration,
    ).reduce((acc, [key, value]) => {
      const price =
        cachedProductPrice.priceConfiguration[key].availableOptions[value];

      return acc + price;
    }, 0);

    return toppingsTotal + productTotal;
  };

  private getCurrentToppingPrice = (
    topping: Topping,
    toppingPricing: ToppingPricingCache[],
  ) => {
    const currentTopping = toppingPricing.find(
      (curr) => topping.id === curr.toppingId,
    );

    if (!currentTopping) {
      return topping.price;
    }

    return Number(currentTopping.price);
  };

  private getDicountPercentage = async (
    couponCode: string,
    tenantId: string,
  ) => {
    const code = await couponModel.findOne({
      code: couponCode,
      tenant: tenantId,
    });

    if (!code) {
      return 0;
    }

    const currentDate = new Date();
    const couponDate = new Date(code.validUpto);

    if (currentDate <= couponDate) {
      return code.discount;
    }
    return 0;
  };
}
