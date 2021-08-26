import { UpdateBodyDTO, ResetPasswordBodyDTO, ForgotPasswordBodyDTO } from './user-dto';
import express from "express";
import { asyncWrap } from "../../async-wrap";
import authenticate from "../../middlewares/auth-middleware";
import UserController from "./user-controller";
import validate from "../../middlewares/validate-middleware";
import multer from 'multer';

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
	authenticate("user"),
	multer().single("image"),
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
