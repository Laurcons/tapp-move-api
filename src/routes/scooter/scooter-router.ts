
import express from "express";
import { asyncWrap } from "../../async-wrap";
import authenticate from "../../middlewares/auth-middleware";
import validate from "../../middlewares/validate-middleware";
import ScooterController from "./scooter-controller";
import { FindNearQueryDTO, PingBodyDTO, ScooterCodeParamsDTO } from "./scooter-dto";

const scooterRouter = express.Router();

scooterRouter.get(
	"/near",
	authenticate("user"),
	validate({ query: FindNearQueryDTO }),
	asyncWrap(ScooterController.findNear)
);
scooterRouter.get(
	"/:code",
	authenticate("user"),
	validate({ params: ScooterCodeParamsDTO }),
	asyncWrap(ScooterController.getId)
);
scooterRouter.post(
	"/:code/ping",
	authenticate("user"),
	validate({ params: ScooterCodeParamsDTO, body: PingBodyDTO }),
	asyncWrap(ScooterController.ping)
);

export default scooterRouter;
