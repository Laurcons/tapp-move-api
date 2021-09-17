import bcrypt from "bcrypt";
import { JwtPayload } from "jsonwebtoken";
import ApiError from "../api-error";
import { JWTP } from "../jwt-promise";
import { Admin, AdminModel } from "../routes/admin/accounts/admin-model";
import CrudService from "./crud-service-base";
import SessionService from "./session-service";

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
			throw ApiError.users.invalidToken;
		}
		const session = await this.sessionService.findSessionForAdmin(
			userId,
			options?.withPassword ?? false
		);
		if (!session || session.expires.getTime() < Date.now()) {
			throw ApiError.users.invalidToken;
		}
		return session;
	}

	async updateLastLogin(admin: Admin) {
		await this.model.updateOne(
			{ _id: admin._id },
			{ $set: { lastLoginAt: new Date() } }
		);
	}

	async login(email: string, password: string) {
		const admin = await this.model.findOne({ email }).select("+password");
		if (!admin) throw ApiError.users.userNotFound;
		if (!(await this.verifyPassword(password, admin.password)))
			throw ApiError.users.userNotFound;
		// go ahead
		const jwt = await JWTP.sign({}, {
			subject: admin._id.toString(),
		});
		this.updateLastLogin(admin);
		this.sessionService.createAdminSession(admin, jwt);
		return {
			jwt,
			admin,
		};
	}

	async logout(admin: Admin) {
		this.sessionService.removeAdminSession(admin);
	}
}
class AdminAuthServiceInstance extends AdminAuthService {}
