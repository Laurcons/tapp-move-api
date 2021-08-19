import express from "express";
import { asyncWrap } from "../async-wrap";
import authenticate from "../middlewares/auth-middleware";
import UserController from "../controllers/user-controller";
import { validate } from "express-validation";
import {
	loginValidator,
	registerValidator,
	updateValidator,
} from "../validators/user-validators";

const userRouter = express.Router();

userRouter.post(
	"/register",
	validate(registerValidator),
	asyncWrap(UserController.register)
);
userRouter.post(
	"/login",
	validate(loginValidator),
	asyncWrap(UserController.login)
);
userRouter.post(
	"/logout",
	authenticate("user"),
	asyncWrap(UserController.logout)
);
userRouter.get(
	"/me",
	authenticate("user"),
	asyncWrap(UserController.getMe)
);
userRouter.patch(
	"/me",
	authenticate("user"),
	validate(updateValidator),
	asyncWrap(UserController.update)
);

export default userRouter;
