import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";
export class OrderController {
  create = async (req: Request, res: Response, next: NextFunction) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      next(createHttpError(400, result.array()[0].msg));
      return;
    }
    return res.json({ success: true });
  };
}
