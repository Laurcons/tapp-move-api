
import express from "express";
import { asyncWrap } from "../../async-wrap";
import authenticate from "../../middlewares/auth-middleware";
import ScooterController from "./scooter-controller";
import RideController from "./../ride/ride-controller";
import validate from "../../middlewares/validation-middleware";
import { FindNearQueryDTO, PingBodyDTO, ScooterCodeParamsDTO } from "./scooter-dto";
import validateDTO from "../../middlewares/validate-dto-middleware";

const scooterRouter = express.Router();

scooterRouter.get(
	"/near",
	authenticate("user"),
	validateDTO({ query: FindNearQueryDTO }),
	asyncWrap(ScooterController.findNear)
);
scooterRouter.get(
	"/:code",
	authenticate("user"),
	validateDTO({ params: ScooterCodeParamsDTO }),
	asyncWrap(ScooterController.getId)
);
scooterRouter.post(
	"/:code/startRide",
	authenticate("user"),
	validateDTO({ params: ScooterCodeParamsDTO }),
	asyncWrap(RideController.startRide)
);
scooterRouter.post(
	"/:code/ping",
	authenticate("user"),
	validateDTO({ params: ScooterCodeParamsDTO, body: PingBodyDTO }),
	asyncWrap(ScooterController.ping)
);

export default scooterRouter;
