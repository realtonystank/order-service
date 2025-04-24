import express, { Request, Response } from "express";
import { globalErrorHandler } from "./common/middleware/globalErrorHandler";
import cookieParser from "cookie-parser";
import customerRouter from "./customer/customerRouter";
import couponRouter from "./coupon/couponRouter";
import cors from "cors";
import config from "config";

const app = express();
app.use(
  cors({
    origin: [config.get("client.url")],
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"],
  }),
);
app.use(cookieParser());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello from order service service!" });
});

app.use("/customer", customerRouter);
app.use("/coupon", couponRouter);

app.use(globalErrorHandler);

export default app;
