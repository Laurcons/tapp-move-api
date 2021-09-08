import { UploadBodyDTO, EndUploadQueryDTO } from './uploads-dto';
import express from "express";
import authenticate from "../../middlewares/auth-middleware";
import validate from "../../middlewares/validate-middleware";
import UploadsController from "./uploads-controller";
import { asyncWrap } from '../../async-wrap';

const uploadsRouter = express.Router();

uploadsRouter.post(
    "/",
    authenticate("user"),
    validate({ body: UploadBodyDTO }),
    asyncWrap(UploadsController.beginUpload)
);

uploadsRouter.get(
    "/confirm",
    validate({ query: EndUploadQueryDTO }),
    asyncWrap(UploadsController.endUpload)
);

export default uploadsRouter;