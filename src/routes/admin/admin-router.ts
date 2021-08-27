import express from "express";
import authRouter from "./auth/auth-router";

const adminRouter = express.Router();

adminRouter.use("/auth", authRouter);

export default adminRouter;