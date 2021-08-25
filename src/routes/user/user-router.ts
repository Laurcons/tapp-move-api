import { UpdateBodyDTO } from './user-dto';
import express from "express";
import { asyncWrap } from "../../async-wrap";
import authenticate from "../../middlewares/auth-middleware";
import UserController from "./user-controller";
import validate from "../../middlewares/validation-middleware";
import validateDTO from "../../middlewares/validate-dto-middleware";
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
	validateDTO({ body: UpdateBodyDTO }),
	asyncWrap(UserController.update)
);
userRouter.post(
	"/me/driversLicense",
	authenticate("user"),
	multer().single("image"),
	asyncWrap(UserController.uploadDriversLicense)
);

export default userRouter;
