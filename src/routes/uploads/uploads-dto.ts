import * as cv from "class-validator";
import { UploadScopes } from "../../services/uploads-service";
import { UploadParams } from './../../services/uploads-service';

export class UploadBodyDTO {
    @cv.IsIn(UploadScopes)
    scope!: keyof UploadParams;
}

export class DriversLicenseUploadBodyDTO extends UploadBodyDTO {
    @cv.Equals("drivers-license")
    scope!: "drivers-license";

    @cv.IsMimeType()
    contentType!: string;
}

export class EndUploadQueryDTO {
    @cv.IsJWT()
    payload!: string;
}