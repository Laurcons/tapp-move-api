import express from "express";
import { asyncWrap } from "../../../async-wrap";
import authenticate from "../../../middlewares/auth-middleware";
import AdminUsersController from "./admin-users-controller";

const usersRouter = express.Router();

usersRouter.get(
    "/",
    authenticate("admin"),
    asyncWrap(AdminUsersController.getAll)
);

export default usersRouter;