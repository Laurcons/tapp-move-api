import express from "express";
import accountRouter from "./accounts/admin-account-router";
import authRouter from "./auth/admin-auth-router";

const adminRouter = express.Router();

adminRouter.use("/auth", authRouter);
adminRouter.use("/accounts", accountRouter);

export default adminRouter;