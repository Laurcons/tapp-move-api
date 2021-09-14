import express from "express";
import { asyncWrap } from "../../async-wrap";
import RideController from "./ride-controller";
import authenticate from "../../middlewares/auth-middleware";
import { LocationQueryDTO, StartRideBodyDTO, StartRideQueryDTO, PatchBodyDTO, GetRidesQueryDTO } from "./ride-dto";
import validate from "../../middlewares/validate-middleware";
import { PaginationQueryDTO } from "../../common-dtos/pagination-query-dto";
import { IdParamsDTO } from "../../common-dtos/id-params-dto";

const rideRouter = express.Router();

rideRouter.get(
	"/",
	authenticate("user"),
	validate({ query: GetRidesQueryDTO }),
	asyncWrap(RideController.getRides)
);
rideRouter.post(
	"/",
	authenticate("user"),
	validate({ body: StartRideBodyDTO, query: StartRideQueryDTO }),
	asyncWrap(RideController.startRide)
);
rideRouter.get(
	"/history",
	authenticate("user"),
	validate({ query: PaginationQueryDTO }),
	asyncWrap(RideController.getHistory)
);
rideRouter.get("/:id",
    authenticate("user"),
    validate({ params: IdParamsDTO, query: LocationQueryDTO }),
    asyncWrap(RideController.getRide)
);
rideRouter.post(
	"/:id/end",
	authenticate("user"),
	validate({ params: IdParamsDTO, query: LocationQueryDTO }),
	asyncWrap(RideController.endRide)
);
rideRouter.patch(
	"/:id",
	authenticate("user"),
	validate({ params: IdParamsDTO, body: PatchBodyDTO }),
	asyncWrap(RideController.patch)
);
rideRouter.post(
	"/:id/pay",
	authenticate("user"),
	validate({ params: IdParamsDTO }),
	asyncWrap(RideController.pay)
);

export default rideRouter;