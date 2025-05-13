import { CashFreeGW } from "../../payment/cashfree";

let cashfree: CashFreeGW | null = null;

export const createCashFreeGW = () => {
  if (!cashfree) {
    cashfree = new CashFreeGW();
  }
  return cashfree;
};
