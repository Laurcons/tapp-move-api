import express from "express";
import adminRouter from "./admin/admin-router";
import authRouter from "./auth/auth-router";
import rideRouter from "./ride/ride-router";
import scooterRouter from "./scooter/scooter-router";
import userRouter from "./user/user-router";

const appRouter = express.Router();
appRouter.use("/auth", authRouter);
appRouter.use("/users", userRouter);
appRouter.use("/scooters", scooterRouter);
appRouter.use("/rides", rideRouter);
appRouter.use("/admin", adminRouter);

export default appRouter;
