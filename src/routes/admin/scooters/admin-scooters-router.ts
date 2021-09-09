import express from "express";
import { asyncWrap } from "../../../async-wrap";
import authenticate from "../../../middlewares/auth-middleware";
import validate from "../../../middlewares/validate-middleware";
import AdminScootersController from "./admin-scooters-controller";
import { PaginationQueryDTO, ScooterIdParamsDTO } from "./admin-scooters-dto";

const scootersRouter = express.Router();

scootersRouter.get(
    "/",
    authenticate("admin"),
    asyncWrap(AdminScootersController.getAll)
);
scootersRouter.get(
    "/:id",
    authenticate("admin"),
    validate({ params: ScooterIdParamsDTO }),
    asyncWrap(AdminScootersController.getOne)
);
scootersRouter.post(
    "/:id/toggleDisabled",
    authenticate("admin"),
    validate({ params: ScooterIdParamsDTO }),
    asyncWrap(AdminScootersController.toggleDisabled)
);
scootersRouter.get(
    "/:id/rides",
    authenticate("admin"),
    validate({ params: ScooterIdParamsDTO, query: PaginationQueryDTO}),
    asyncWrap(AdminScootersController.getRides)
);

export default scootersRouter;