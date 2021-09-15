
import express from "express";
import basicAuth from "express-basic-auth";
import { asyncWrap } from "../../async-wrap";
import Config from "../../environment";
import PagesController from "./pages-controller";

const viewsRouter = express.Router();

viewsRouter.get(
	"/forgotPassword",
	asyncWrap(PagesController.getForgotPassword)
);
viewsRouter.get(
	"/completePayment",
	asyncWrap(PagesController.completePayment)
);

const username = Config.get("SCOOTER_PANEL_USER");
const password = Config.get("SCOOTER_PANEL_PASS");
viewsRouter.get(
    "/scooterPanel",
    basicAuth({ challenge: true, users: { [username]: password } }),
    asyncWrap(PagesController.getScooterPanel)
)

export default viewsRouter;