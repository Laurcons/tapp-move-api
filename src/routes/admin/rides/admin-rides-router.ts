import express from "express";
import { asyncWrap } from "../../../async-wrap";
import { IdParamsDTO } from "../../../common-dtos/id-params-dto";
import { PaginationQueryDTO } from "../../../common-dtos/pagination-query-dto";
import authenticate from "../../../middlewares/auth-middleware";
import validate from "../../../middlewares/validate-middleware";
import AdminRidesController from "./admin-rides-controller";

const ridesRouter = express.Router();

ridesRouter.get(
    "/",
    authenticate("admin"),
    validate({ query: PaginationQueryDTO }),
    asyncWrap(AdminRidesController.getAll)
);
ridesRouter.get(
    "/:id",
    authenticate("admin"),
    validate({ params: IdParamsDTO }),
    asyncWrap(AdminRidesController.getOne)
);
ridesRouter.post(
	"/:id/pay",
	authenticate("admin"),
	validate({ params: IdParamsDTO }),
	asyncWrap(AdminRidesController.pay)
);

export default ridesRouter;