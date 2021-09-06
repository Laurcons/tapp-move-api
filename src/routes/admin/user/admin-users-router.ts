import express from "express";
import { asyncWrap } from "../../../async-wrap";
import authenticate from "../../../middlewares/auth-middleware";
import validate from "../../../middlewares/validate-middleware";
import AdminUsersController from "./admin-users-controller";
import { UserIdParamsDTO } from "./admin-users-dto";

const usersRouter = express.Router();

usersRouter.get(
    "/",
    authenticate("admin"),
    asyncWrap(AdminUsersController.getAll)
);
usersRouter.get(
    "/:id",
    authenticate("admin"),
    validate({ params: UserIdParamsDTO }),
    asyncWrap(AdminUsersController.getOne)
);

export default usersRouter;