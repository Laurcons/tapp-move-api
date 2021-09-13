import express from "express";
import accountRouter from "./accounts/admin-account-router";
import authRouter from "./auth/admin-auth-router";
import ridesRouter from "./rides/admin-rides-router";
import scootersRouter from "./scooters/admin-scooters-router";
import usersRouter from "./users/admin-users-router";

const adminRouter = express.Router();

adminRouter.use("/auth", authRouter);
adminRouter.use("/accounts", accountRouter);
adminRouter.use("/users", usersRouter);
adminRouter.use("/scooters", scootersRouter);
adminRouter.use("/rides", ridesRouter);

export default adminRouter;