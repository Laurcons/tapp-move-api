import express from "express";
import { asyncWrap } from "../../async-wrap";
import RideController from "./ride-controller";
import authenticate from "../../middlewares/auth-middleware";
import { LocationQueryDTO, ToggleLockBodyDTO } from "./ride-dto";
import validateDTO from "../../middlewares/validate-dto-middleware";

const rideRouter = express.Router();

rideRouter.get("/current",
    authenticate("user"),
    validateDTO({ query: LocationQueryDTO }),
    asyncWrap(RideController.getCurrent)
);
rideRouter.post(
	"/current/end",
	authenticate("user"),
	validateDTO({ query: LocationQueryDTO }), // uses similar schema
	asyncWrap(RideController.endCurrent)
);
rideRouter.post(
	"/current/toggleLock",
	authenticate("user"),
	validateDTO({ body: ToggleLockBodyDTO }),
	asyncWrap(RideController.toggleLock)
);
rideRouter.get(
    "/history",
    authenticate("user"),
    asyncWrap(RideController.getHistory)
);

export default rideRouter;