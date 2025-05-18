import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";
import { AuthRequest, CartItem, Topping } from "../types";
import productCacheModel, {
  ProductPricingCache,
} from "../productCache/productCacheModel";
import toppingCacheModel, {
  ToppingPricingCache,
} from "../toppingCache/toppingCacheModel";
import couponModel from "../coupon/couponModel";
import orderModel from "./orderModel";
import { OrderStatus, PaymentMode, PaymentStatus } from "./orderTypes";
import idempotencyModel from "../idempotency/idempotencyModel";
import mongoose from "mongoose";
import { PaymentGW } from "../payment/paymentTypes";
import { MessageBroker } from "../types/broker";
import { Logger } from "winston";
import customerModel from "../customer/customerModel";
import { Roles } from "../common/constants";
export class OrderController {
  constructor(
    private paymentGw: PaymentGW,
    private broker: MessageBroker,
    private logger: Logger,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      next(createHttpError(400, result.array()[0].msg));
      return;
    }

    const {
      cart,
      couponCode,
      tenantId,
      paymentMode,
      customerId,
      comment,
      address,
    } = req.body;

    const totalPrice = await this.calculateTotal(cart);

    let discountPercentage = 0;
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

    const DELIVERY_CHARGES = 75;

    const finalTotal = priceAfterDiscount + taxes + DELIVERY_CHARGES;

    const idempotencyKey = req.headers["idempotency-key"];

    console.log("idempotencyKey - ", idempotencyKey);

    const idempotency = await idempotencyModel.findOne({ key: idempotencyKey });

    let newOrder = idempotency ? [idempotency.response] : [];

    if (!idempotency) {
      console.log("idempotency key not found, hence creating a new order");
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        newOrder = await orderModel.create(
          [
            {
              cart,
              address,
              comment,
              customerId,
              deliveryCharges: DELIVERY_CHARGES,
              discount: discountAmount,
              paymentMode,
              orderStatus: OrderStatus.RECEIVED,
              paymentStatus: PaymentStatus.PENDING,
              taxes,
              tenantId,
              total: finalTotal,
            },
          ],
          { session },
        );

        await idempotencyModel.create(
          [{ key: idempotencyKey, response: newOrder[0] }],
          { session },
        );
        await session.commitTransaction();
      } catch (err) {
        console.log(
          "Something went wrong while creating new order or creating idempotency key",
        );
        await session.abortTransaction();
        return next(createHttpError(500, err.message));
      } finally {
        await session.endSession();
      }
    }
    if (paymentMode === PaymentMode.CARD) {
      const session = await this.paymentGw.createSession({
        amount: finalTotal,
        orderId: newOrder[0]._id.toString(),
        cashfreeOrderId: `${newOrder[0]._id.toString()}${this.generateRandomSuffix()}`,
        tenantId: tenantId,
        currency: "INR",
        idempotencyKey: idempotencyKey as string,
      });
      await this.broker.sendMessage("order", JSON.stringify(newOrder));
      return res.json({ session });
    }

    await this.broker.sendMessage("order", JSON.stringify(newOrder));

    return res.json({
      session: {
        orderId: newOrder[0]._id,
        paymentMode: "cash",
        tenantId,
      },
    });
  };

  getMine = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.auth.sub;

    if (!userId) {
      return next(createHttpError(400, "Not user id found."));
    }

    const customer = await customerModel.findOne({ userId });

    if (!customer) {
      return next(createHttpError(400, "No customer found."));
    }

    const orders = await orderModel.find(
      { customerId: customer._id },
      { cart: 0 },
    );

    return res.json(orders);
  };

  getSingle = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const orderId = req.params.orderId;
    const { sub: userId, role, tenant: tenantId } = req.auth;

    const fields = req.query.fields
      ? req.query.fields.toString().split(",")
      : [];

    const projection = fields.reduce(
      (acc, item) => {
        acc[item] = 1;
        return acc;
      },
      { customerId: 1 },
    );

    const order = await orderModel
      .findOne({ _id: orderId }, projection)
      .populate("customerId", "firstName lastName")
      .exec();
    if (!order) {
      return next(createHttpError(400, "order does not exist."));
    }

    if (role === Roles.ADMIN) {
      return res.json(order);
    }

    const myRestaurantOrder = order.tenantId === tenantId;
    if (role === Roles.MANAGER && myRestaurantOrder) {
      return res.json(order);
    }

    if (role === Roles.CUSTOMER) {
      const customer = await customerModel.findOne({ userId });

      if (!customer) {
        return next(createHttpError(400, "No customer found."));
      }

      if (customer._id === order.customerId._id) {
        return res.json(order);
      }
    }

    return next(createHttpError(403, "Operation not permitted."));
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
  private generateRandomSuffix(length = 7): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
