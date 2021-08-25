import express from "express";
import { asyncWrap } from "../../async-wrap";
import authenticate from "../../middlewares/auth-middleware";
import validate from "../../middlewares/validate-middleware";
import AuthController from "./auth-controller";
import {
	BeginForgotPasswordBodyDTO,
	LoginBodyDTO,
	RegisterBodyDTO,
} from "./auth-dto";

const authRouter = express.Router();

authRouter.post(
	"/register",
	validate({ body: RegisterBodyDTO }),
	asyncWrap(AuthController.register)
);
authRouter.post(
	"/login",
	validate({ body: LoginBodyDTO }),
	asyncWrap(AuthController.login)
);
authRouter.post(
	"/logout",
	authenticate("user"),
	asyncWrap(AuthController.logout)
);
authRouter.post(
	"/forgotPassword",
	validate({ body: BeginForgotPasswordBodyDTO }),
	asyncWrap(AuthController.beginForgotPassword)
);

export default authRouter;
