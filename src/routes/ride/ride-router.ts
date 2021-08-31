import express from "express";
import { asyncWrap } from "../../async-wrap";
import RideController from "./ride-controller";
import authenticate from "../../middlewares/auth-middleware";
import { LocationQueryDTO, PaginationQueryDTO, StartRideBodyDTO, StartRideQueryDTO, PatchBodyDTO } from "./ride-dto";
import validate from "../../middlewares/validate-middleware";

const rideRouter = express.Router();

rideRouter.post(
	"/",
	authenticate("user"),
	validate({ body: StartRideBodyDTO, query: StartRideQueryDTO }),
	asyncWrap(RideController.startRide)
);
rideRouter.get("/current",
    authenticate("user"),
    validate({ query: LocationQueryDTO }),
    asyncWrap(RideController.getCurrent)
);
rideRouter.post(
	"/current/end",
	authenticate("user"),
	validate({ query: LocationQueryDTO }), // uses similar schema
	asyncWrap(RideController.endCurrent)
);
rideRouter.patch(
	"/current",
	authenticate("user"),
	validate({ body: PatchBodyDTO }),
	asyncWrap(RideController.patch)
);
rideRouter.get(
    "/history",
    authenticate("user"),
    validate({ query: PaginationQueryDTO }),
    asyncWrap(RideController.getHistory)
);

export default rideRouter;