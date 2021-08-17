import express from "express";
import { asyncWrap } from "./async-wrap";
import UserController from "./controllers/user-controller";
import withAuthentication from "./middlewares/auth-middleware";

const userRouter = express.Router();
userRouter.post("/register", asyncWrap(UserController.register));
userRouter.post("/login", asyncWrap(UserController.login));
userRouter.post(
	"/logout",
	withAuthentication("user"),
	asyncWrap(UserController.logout)
);

const appRouter = express.Router();
appRouter.use(userRouter);

export default appRouter;
