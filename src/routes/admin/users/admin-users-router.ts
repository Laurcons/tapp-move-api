import express from "express";
import { asyncWrap } from "../../../async-wrap";
import { IdParamsDTO } from "../../../common-dtos/id-params-dto";
import authenticate from "../../../middlewares/auth-middleware";
import validate from "../../../middlewares/validate-middleware";
import AdminUsersController from "./admin-users-controller";
import { SuspendUserBodyDTO } from "./admin-users-dto";

const usersRouter = express.Router();

usersRouter.get(
    "/",
    authenticate("admin"),
    asyncWrap(AdminUsersController.getAll)
);
usersRouter.get(
    "/:id",
    authenticate("admin"),
    validate({ params: IdParamsDTO }),
    asyncWrap(AdminUsersController.getOne)
);
usersRouter.get(
    "/:id/rides",
    authenticate("admin"),
    validate({ params: IdParamsDTO }),
    asyncWrap(AdminUsersController.getRidesForUser)
);
usersRouter.post(
    "/:id/suspend",
    authenticate("admin"),
    validate({ params: IdParamsDTO, body: SuspendUserBodyDTO }),
    asyncWrap(AdminUsersController.suspend)
);


export default usersRouter;