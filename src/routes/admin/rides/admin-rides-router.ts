import express from "express";
import { asyncWrap } from "../../../async-wrap";
import authenticate from "../../../middlewares/auth-middleware";
import validate from "../../../middlewares/validate-middleware";
import { PaginationQueryDTO } from "../users/admin-users-dto";
import AdminRidesController from "./admin-rides-controller";

const ridesRouter = express.Router();

ridesRouter.get(
    "/",
    authenticate("admin"),
    validate({ query: PaginationQueryDTO }),
    asyncWrap(AdminRidesController.getAll)
);

export default ridesRouter;