import { findNearValidator, getIdValidator } from './../validators/scooter-validators';
import express from "express";
import { asyncWrap } from "../async-wrap";
import authenticate from "../middlewares/auth-middleware";
import ScooterController from "../controllers/scooter-controller";
import { validate } from "express-validation";

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

export default scooterRouter;