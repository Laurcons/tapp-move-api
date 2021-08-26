
import express from "express";
import { asyncWrap } from "../../async-wrap";
import PagesController from "./pages-controller";

const viewsRouter = express.Router();

viewsRouter.get(
    "/forgotPassword",
    asyncWrap(PagesController.getForgotPassword)
);

export default viewsRouter;