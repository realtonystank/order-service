import customerModel from "./customerModel";
import { Address, Customer } from "./customerTypes";

export class CustomerService {
  findCustomerByUserId = async (userId: string) => {
    return customerModel.findOne({ userId });
  };
  createCustomer = async (customer: Customer) => {
    const newCustomer = new customerModel(customer);
    return newCustomer.save();
  };
  findAndUpdateCustomer = async (
    id: string,
    userId: string,
    {
      address,
    }: {
      address: Address;
    },
  ) => {
    return customerModel.findOneAndUpdate(
      {
        _id: id,
        userId,
      },
      {
        $push: {
          addresses: {
            text: address.text,
            isDefault: false,
          },
        },
      },
      { new: true },
    );
  };
}
