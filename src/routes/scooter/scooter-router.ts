import {
	findNearValidator,
	getIdValidator,
	pingValidator,
	startRideValidator,
	toggleLockValidator,
} from "./scooter-validators";
import express from "express";
import { asyncWrap } from "../../async-wrap";
import authenticate from "../../middlewares/auth-middleware";
import ScooterController from "./scooter-controller";
import validate from "../../middlewares/validation-middleware";

const scooterRouter = express.Router();

scooterRouter.get(
	"/near",
	authenticate("user"),
	validate(findNearValidator),
	asyncWrap(ScooterController.findNear)
);
scooterRouter.get(
	"/:code",
	authenticate("user"),
	validate(getIdValidator),
	asyncWrap(ScooterController.getId)
);
scooterRouter.post(
	"/:code/startRide",
	authenticate("user"),
	validate(startRideValidator),
	asyncWrap(ScooterController.startRide)
);
scooterRouter.post(
	"/:code/ping",
	authenticate("user"),
	validate(pingValidator),
	asyncWrap(ScooterController.ping)
);
scooterRouter.post(
	"/:code/toggleLock",
	authenticate("user"),
	validate(toggleLockValidator),
	asyncWrap(ScooterController.toggleLock)
);

export default scooterRouter;
