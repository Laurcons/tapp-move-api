import express from "express";
import { asyncWrap } from "../../async-wrap";
import WebhooksController from "./webhooks-controller";

const webhooksRouter = express.Router();

webhooksRouter.post(
    "/stripe",
    asyncWrap(WebhooksController.stripe)
);

export default webhooksRouter;