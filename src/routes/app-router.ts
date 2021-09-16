import express from "express";
import adminRouter from "./admin/admin-router";
import authRouter from "./auth/auth-router";
import rideRouter from "./ride/ride-router";
import scooterRouter from "./scooter/scooter-router";
import uploadsRouter from "./uploads/uploads-router";
import userRouter from "./user/user-router";
import webhooksRouter from "./webhooks/webhooks-router";

const appRouter = express.Router();
appRouter.use("/auth", authRouter);
appRouter.use("/users", userRouter);
appRouter.use("/scooters", scooterRouter);
appRouter.use("/rides", rideRouter);
appRouter.use("/uploads", uploadsRouter);
appRouter.use("/admin", adminRouter);
appRouter.use("/webhooks", webhooksRouter);

export default appRouter;
