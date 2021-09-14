import express from "express";
import multer from 'multer';
import { asyncWrap } from "../../async-wrap";
import authenticate from "../../middlewares/auth-middleware";
import validate from "../../middlewares/validate-middleware";
import UserController from "./user-controller";
import { ForgotPasswordBodyDTO, ResetPasswordBodyDTO, UpdateBodyDTO } from './user-dto';

const userRouter = express.Router();

userRouter.get(
	"/me", 
	authenticate("user"),
	asyncWrap(UserController.getMe)
);
userRouter.patch(
	"/me",
	authenticate("user", { withPassword: true }),
	validate({ body: UpdateBodyDTO }),
	asyncWrap(UserController.update)
);
userRouter.post(
	"/me/driversLicense",
	multer().single("image"),
	authenticate("user"),
	asyncWrap(UserController.uploadDriversLicense)
);
userRouter.post(
	"/forgotPassword",
	validate({ body: ForgotPasswordBodyDTO }),
	asyncWrap(UserController.forgotPassword)
)
userRouter.post(
	"/resetPassword",
	validate({ body: ResetPasswordBodyDTO}),
	asyncWrap(UserController.resetPassword)
);

export default userRouter;
