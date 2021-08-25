import express from "express";
import { asyncWrap } from "../../async-wrap";
import authenticate from "../../middlewares/auth-middleware";
import validateDTO from "../../middlewares/validate-dto-middleware";
import AuthController from "./auth-controller";
import { LoginBodyDTO, RegisterBodyDTO } from "./auth-dto";

const authRouter = express.Router();

authRouter.post(
	"/register",
	validateDTO({ body: RegisterBodyDTO }),
	asyncWrap(AuthController.register)
);
authRouter.post(
	"/login",
	validateDTO({ body: LoginBodyDTO }),
	asyncWrap(AuthController.login)
);
authRouter.post(
	"/logout",
	authenticate("user"),
	asyncWrap(AuthController.logout)
);
// authRouter.post(
// 	"/forgotPassword",
// 	validate(forgotPasswordValidator),
// 	asyncWrap(AuthController.beginForgotPassword)
// );

export default authRouter;