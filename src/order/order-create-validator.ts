import { checkSchema } from "express-validator";

export default checkSchema({
  cart: {
    exists: {
      errorMessage: "cart is required.",
    },
    isArray: {
      errorMessage: "cart must be an array.",
    },
  },
  "cart.*._id": {
    exists: {
      errorMessage: "an item in cart with it's id is required.",
    },
    isMongoId: {
      errorMessage: "cart item id is not in proper format.",
    },
  },
  "cart.*.chosenConfiguration.priceConfiguration": {
    exists: {
      errorMessage: "cart item chosen configuration is required.",
    },
  },
  tenantId: {
    exists: {
      errorMessage: "tenantId is required.",
    },
    custom: {
      options: (value) => {
        if (isNaN(Number(value))) {
          throw new Error("Given tenantId is not in proper format.");
        }

        return true;
      },
    },
  },
  address: {
    exists: {
      errorMessage: "Address is required.",
    },
    isString: {
      errorMessage: "Address must be a string.",
    },
  },
  customerId: {
    exists: {
      errorMessage: "customerId is required.",
    },
    isMongoId: {
      errorMessage: "customerId is not in proper format.",
    },
  },
  paymentMode: {
    exists: {
      errorMessage: "paymentMode is required.",
    },
    isIn: {
      options: [["cash", "card"]],
      errorMessage: "Incorrect payment option provided.",
    },
  },
});
