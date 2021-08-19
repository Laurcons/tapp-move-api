import express from "express";
import scooterRouter from "./scooter-router";
import userRouter from "./user-router";

const appRouter = express.Router();
appRouter.use("/users", userRouter);
appRouter.use("/scooters", scooterRouter);

export default appRouter;
