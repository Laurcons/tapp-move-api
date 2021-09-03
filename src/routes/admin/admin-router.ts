import express from "express";
import accountRouter from "./accounts/admin-account-router";
import authRouter from "./auth/admin-auth-router";
import usersRouter from "./user/admin-users-router";

const adminRouter = express.Router();

adminRouter.use("/auth", authRouter);
adminRouter.use("/accounts", accountRouter);
adminRouter.use("/users", usersRouter);

export default adminRouter;