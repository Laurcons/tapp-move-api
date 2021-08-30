import express from "express";
import { asyncWrap } from "../../../async-wrap";
import { LoginBodyDTO } from "./auth-dto";
import AdminAuthController from "./auth-controller";
import validate from "../../../middlewares/validate-middleware";
import authenticate from "../../../middlewares/auth-middleware";

const authRouter = express.Router();

authRouter.post(
    "/login",
    validate({ body: LoginBodyDTO }),
    asyncWrap(AdminAuthController.login)
);
authRouter.post(
    "/logout",
    authenticate("admin"),
    asyncWrap(AdminAuthController.logout)
);
authRouter.post(
    "/verifyToken",
    authenticate("admin"),
    asyncWrap(AdminAuthController.verifyToken)
);

export default authRouter;