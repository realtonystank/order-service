import { Request, Response } from "express";
export class OrderController {
  create = async (req: Request, res: Response) => {
    return res.json({ success: true });
  };
}
