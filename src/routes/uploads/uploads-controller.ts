import { plainToClass } from "class-transformer";
import { validate } from "class-validator";
import { Request, Response } from "express";
import { JWTP } from "../../jwt-promise";
import UploadsService from "../../services/uploads-service";
import UserService from "../../services/user-service";
import { DriversLicenseUploadBodyDTO, EndUploadQueryDTO, UploadBodyDTO } from "./uploads-dto";

class UploadsController {
    private uploadsService = UploadsService.instance;
    private userService = UserService.instance;

    beginUpload = async (
        req: Request<{}, {}, UploadBodyDTO>,
        res: Response
    ) => {
        const { scope } = req.body;
        let result: any;
        switch (scope) {
            case "drivers-license": {
                const body = plainToClass(DriversLicenseUploadBodyDTO, req.body);
                const errors = await validate(body);
                if (errors[0]) throw errors[0];
                result = await this.uploadsService.beginUpload(req.session.user, scope, {
                    contentType: body.contentType,
                    userId: req.session.user._id
                });
            } break;
        }
        res.json({
			status: "success",
			...result,
		});
    }

    endUpload = async (
        req: Request<{}, {}, {}, Partial<EndUploadQueryDTO>>,
        res: Response
    ) => {
        const { payload } = req.query as EndUploadQueryDTO;
        const token = await JWTP.verify(payload);
        const { sub, key, scope } = token as { sub: string; key: string; scope: string; };
        let result: any = {};
        switch (scope) {
            case "drivers-license": {
                await this.userService.setDriversLicense(sub, key);
                result.key = key;
            } break;
        }
        res.json({
            status: "success",
            ...result
        });
    }
}
export default new UploadsController();