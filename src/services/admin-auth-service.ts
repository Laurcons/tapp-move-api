import { Admin, AdminModel } from "../routes/admin/admin-account/admin-model";
import CrudService from "./crud-service-base";
import bcrypt from "bcrypt";
import ApiError from "../errors/api-error";
import { JWTP } from "../jwt-promise";
import Config from "../environment";
import SessionService from "./session-service";

export abstract class AdminAuthService extends CrudService<Admin> {
    private sessionService = SessionService.instance;

    private static _instance: AdminAuthService | null = null;
    static get instance() {
        if (!this._instance)
            this._instance = new AdminAuthServiceInstance();
        return this._instance;
    }

    constructor() {
        super(AdminModel);
    }

    private async verifyPassword(raw: string, hash: string) {
        return await bcrypt.compare(raw, hash);
    }

    private async hashPassword(raw: string) {
        // increased salt entropy (from user service's 12) bc this is ADMIN after all
        // ... i guess
        return await bcrypt.hash(raw, 14);
    }

    async login(email: string, password: string) {
        const admin = await this.model.findOne({ email }).select("+password");
        if (!admin)
            throw ApiError.userNotFound;
        if (!await this.verifyPassword(password, admin.password))
            throw ApiError.userNotFound;
        // go ahead
        const jwt = await JWTP.sign({}, Config.get("AUTH_SECRET"), {
            subject: admin._id.toString()
        });
        admin.lastLoginAt = new Date();
        await admin.save();
        await this.sessionService.insert({
            type: "admin",
            jwt,
            admin
        });
        return {
            jwt, admin
        };
    }

    async logout(admin: Admin) {
        await this.sessionService.deleteMany({
            "admin._id": admin._id
        });
    }
}
class AdminAuthServiceInstance extends AdminAuthService {}