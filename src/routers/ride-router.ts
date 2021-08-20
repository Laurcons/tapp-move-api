
import express from "express";
import { asyncWrap } from "../async-wrap";
import RideController from "../controllers/ride-controller";
import authenticate from "../middlewares/auth-middleware";
import validate from "../middlewares/validation-middleware";
import { getCurrentValidator } from "../validators/ride-validators";

const rideRouter = express.Router();

rideRouter.get("/current",
    authenticate("user"),
    validate(getCurrentValidator),
    asyncWrap(RideController.getCurrent)
);

export default rideRouter;