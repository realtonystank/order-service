import { Response } from "express";
import { AuthRequest } from "../types";
import { CustomerService } from "./customerService";
import { Logger } from "winston";
export class CustomerController {
  constructor(
    private customerService: CustomerService,
    private logger: Logger,
  ) {}
  getCustomer = async (req: AuthRequest, res: Response) => {
    const { sub: userId, firstName, lastName, email } = req.auth;

    this.logger.info("Request to get Customer with userId: ", userId);
    const customer = await this.customerService.findCustomerByUserId(userId);
    if (!customer) {
      this.logger.info(`Customer with userId:${userId} not found.`);
      const newCustomer = await this.customerService.createCustomer({
        userId,
        firstName,
        lastName,
        email,
        addresses: [],
      });
      this.logger.info(
        `Created new customer with userId:${userId} and id:${newCustomer._id}`,
      );

      return res.json(newCustomer);
    }

    this.logger.info(`Found customer with userId: ${userId}`);

    res.json(customer);
  };

  addAddress = async (req: AuthRequest, res: Response) => {
    const { sub: userId } = req.auth;

    this.logger.info(
      `Received request to add address for customer with id:${req.params.id} and userId: ${userId}`,
    );

    const payload = {
      address: {
        text: req.body.text,
        isDefault: req.body.isDefault,
      },
    };

    const customer = await this.customerService.findAndUpdateCustomer(
      req.params.id,
      userId,
      payload,
    );
    if (customer) {
      this.logger.info(
        `Successfully added Address for customer with id: ${req.params.id}`,
      );
      return res.json(customer);
    }

    this.logger.info(
      `Unable to find customer with id: ${req.params.id} and user id:${userId}`,
    );
    res.status(404).json({ message: "Customer not found." });
  };
}
