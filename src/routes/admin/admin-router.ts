import express from "express";
import accountRouter from "./admin-account/admin-account-router";
import authRouter from "./auth/auth-router";

const adminRouter = express.Router();

adminRouter.use("/auth", authRouter);
adminRouter.use("/accounts", accountRouter);

export default adminRouter;