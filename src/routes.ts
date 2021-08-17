import express from "express";
import { asyncWrap } from "./async-wrap";
import UserController from "./controllers/user-controller";

const userRouter = express.Router();
userRouter.post("/register", asyncWrap(UserController.register));

const appRouter = express.Router();
appRouter.use(userRouter);

export default appRouter;
