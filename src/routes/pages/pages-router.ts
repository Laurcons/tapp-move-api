
import express from "express";
import { asyncWrap } from "../../async-wrap";
import PagesController from "./pages-controller";
import basicAuth from "express-basic-auth";
import Config from "../../environment";

const viewsRouter = express.Router();

viewsRouter.get(
    "/forgotPassword",
    asyncWrap(PagesController.getForgotPassword)
);
const username = Config.get("SCOOTER_PANEL_USER");
const password = Config.get("SCOOTER_PANEL_PASS");
viewsRouter.get(
    "/scooterPanel",
    basicAuth({ challenge: true, users: { [username]: password } }),
    asyncWrap(PagesController.getScooterPanel)
)

export default viewsRouter;