import { Admin, AdminModel } from "../routes/admin/accounts/admin-model";
import CrudService from "./crud-service-base";
import bcrypt from "bcrypt";
import ApiError from "../api-error";
import { JWTP } from "../jwt-promise";
import Config from "../environment";
import SessionService from "./session-service";
import { JwtPayload } from "jsonwebtoken";

export abstract class AdminAuthService extends CrudService<Admin> {
	private sessionService = SessionService.instance;

	private static _instance: AdminAuthService | null = null;
	static get instance() {
		if (!this._instance) this._instance = new AdminAuthServiceInstance();
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

	/** 
     * @exception Throws ApiError
     * @returns A session
     */
	async verifyToken(token: JwtPayload, options?: { withPassword?: boolean }) {
		const userId = token.sub;
		if (!userId) {
			throw ApiError.invalidToken;
		}
		const session = await this.sessionService.findSessionForAdmin(
			userId,
			options?.withPassword ?? false
		);
		if (!session || session.expires.getTime() < Date.now()) {
			throw ApiError.invalidToken;
		}
		return session;
	}

	async login(email: string, password: string) {
		const admin = await this.model.findOne({ email }).select("+password");
		if (!admin) throw ApiError.userNotFound;
		if (!(await this.verifyPassword(password, admin.password)))
			throw ApiError.userNotFound;
		// go ahead
		const jwt = await JWTP.sign({}, Config.get("AUTH_SECRET"), {
			subject: admin._id.toString(),
		});
		// admin.lastLoginAt = new Date();
		// await admin.save();
		await this.model.updateOne(
			{ _id: admin._id },
			{ $set: { lastLoginAt: new Date() } }
		);
		await this.sessionService.insert({
			type: "admin",
			jwt,
			admin,
		});
		return {
			jwt,
			admin,
		};
	}

	async logout(admin: Admin) {
		await this.sessionService.deleteMany({
			"admin._id": admin._id,
		});
	}
}
class AdminAuthServiceInstance extends AdminAuthService {}
