import express from "express";
import authenticate from "../common/middleware/authenticate";
import { Roles } from "../common/constants";
import { canAccess } from "../common/middleware/canAccess";

const router = express.Router();

router.post("/", authenticate, canAccess([Roles.ADMIN, Roles.MANAGER]));

export default router;
