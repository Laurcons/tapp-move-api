
import express from "express";
import { asyncWrap } from "../../async-wrap";
import RideController from "./ride-controller";
import authenticate from "../../middlewares/auth-middleware";
import validate from "../../middlewares/validation-middleware";
import { getCurrentValidator, toggleLockValidator } from "./ride-validators";

const rideRouter = express.Router();

rideRouter.get("/current",
    authenticate("user"),
    validate(getCurrentValidator),
    asyncWrap(RideController.getCurrent)
);
rideRouter.post("/current/end",
    authenticate("user"),
    validate(getCurrentValidator), // uses similar schema
    asyncWrap(RideController.endCurrent)
);
rideRouter.post(
	"/current/toggleLock",
	authenticate("user"),
	validate(toggleLockValidator),
	asyncWrap(RideController.toggleLock)
);
rideRouter.get(
    "/history",
    authenticate("user"),
    asyncWrap(RideController.getHistory)
);

export default rideRouter;