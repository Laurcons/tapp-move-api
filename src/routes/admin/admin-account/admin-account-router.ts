import express from "express";
import { asyncWrap } from "../../../async-wrap";
import authenticate from "../../../middlewares/auth-middleware";
import AdminAccountController from "./admin-account-controller";

const accountRouter = express.Router();

accountRouter.get(
	"/me",
	authenticate("admin"),
	asyncWrap(AdminAccountController.getMe)
);

export default accountRouter;