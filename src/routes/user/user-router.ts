import { LoginBodyDTO, RegisterBodyDTO } from './user-dto';
import express from "express";
import { asyncWrap } from "../../async-wrap";
import authenticate from "../../middlewares/auth-middleware";
import UserController from "./user-controller";
import validate from "../../middlewares/validation-middleware";
import {
	loginValidator,
	registerValidator,
	updateValidator,
} from "./user-validators";
import validateDTO from "../../middlewares/validate-dto-middleware";
import multer from 'multer';

const userRouter = express.Router();

userRouter.post(
	"/register",
	validateDTO({ body: RegisterBodyDTO }),
	asyncWrap(UserController.register)
);
userRouter.post(
	"/login",
	validateDTO({ body: LoginBodyDTO }),
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
userRouter.post(
	"/me/driversLicense",
	authenticate("user"),
	multer().single("image"),
	asyncWrap(UserController.uploadDriversLicense)
);

export default userRouter;
