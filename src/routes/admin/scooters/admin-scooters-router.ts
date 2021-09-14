import express from "express";
import { asyncWrap } from "../../../async-wrap";
import { IdParamsDTO } from "../../../common-dtos/id-params-dto";
import { PaginationQueryDTO } from "../../../common-dtos/pagination-query-dto";
import authenticate from "../../../middlewares/auth-middleware";
import validate from "../../../middlewares/validate-middleware";
import AdminScootersController from "./admin-scooters-controller";
import { AddScooterBodyDTO } from "./admin-scooters-dto";

const scootersRouter = express.Router();

scootersRouter.get(
    "/",
    authenticate("admin"),
    asyncWrap(AdminScootersController.getAll)
);
scootersRouter.post(
    "/",
    authenticate("admin"),
    validate({ body: AddScooterBodyDTO }),
    asyncWrap(AdminScootersController.addNew)
);
scootersRouter.get(
    "/:id",
    authenticate("admin"),
    validate({ params: IdParamsDTO }),
    asyncWrap(AdminScootersController.getOne)
);
scootersRouter.post(
    "/:id/toggleDisabled",
    authenticate("admin"),
    validate({ params: IdParamsDTO }),
    asyncWrap(AdminScootersController.toggleDisabled)
);
scootersRouter.get(
    "/:id/rides",
    authenticate("admin"),
    validate({ params: IdParamsDTO, query: PaginationQueryDTO}),
    asyncWrap(AdminScootersController.getRides)
);

export default scootersRouter;