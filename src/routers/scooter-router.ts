import express from "express";
import { asyncWrap } from "../async-wrap";
import authenticate from "../middlewares/auth-middleware";
import ScooterController from "../controllers/scooter-controller";

const scooterRouter = express.Router();

scooterRouter.get(
	"/near",
	authenticate("user"),
	asyncWrap(ScooterController.findNear)
);

export default scooterRouter;