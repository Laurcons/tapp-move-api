import express from "express";
import { asyncWrap } from "../../../async-wrap";
import authenticate from "../../../middlewares/auth-middleware";
import validate from "../../../middlewares/validate-middleware";
import AdminAuthController from "./admin-auth-controller";
import { LoginBodyDTO } from "./admin-auth-dto";

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