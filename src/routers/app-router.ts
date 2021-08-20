import express from "express";
import rideRouter from "./ride-router";
import scooterRouter from "./scooter-router";
import userRouter from "./user-router";

const appRouter = express.Router();
appRouter.use("/users", userRouter);
appRouter.use("/scooters", scooterRouter);
appRouter.use("/rides", rideRouter);

export default appRouter;
