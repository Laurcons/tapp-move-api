import { User } from "../routes/user/user-model";
import AwsService from "./aws-service";

export const UploadScopes = [
    "drivers-license"
];

export interface UploadParams {
    "drivers-license": { contentType: string; userId: string; }
}

export default abstract class UploadsService {
    private awsService = AwsService.instance;

    private static _instance: UploadsService;
    static get instance() {
        if (!this._instance) this._instance = new UploadsServiceInstance();
        return this._instance;
    }

    async beginUpload<Scope extends keyof UploadParams>(user: User, scope: Scope, params: UploadParams[Scope]) {
        switch (scope) {
            case "drivers-license": {
                const key = `driverslicense-${params.userId}`;
                const postParams = await this.awsService.createPresignedPost(key, params.contentType, { sub: params.userId, key, scope });
                return postParams;
            }
            default: throw new Error("Not implemented");
        }
    }

}
class UploadsServiceInstance extends UploadsService {}