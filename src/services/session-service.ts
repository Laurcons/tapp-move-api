import { Admin } from "../routes/admin/accounts/admin-model";
import { Session, SessionModel } from "../routes/user/session-model";
import { User } from "../routes/user/user-model";
import CrudService from "./crud-service-base";

export default abstract class SessionService extends CrudService<Session> {
	private static _instance: SessionService | null = null;
	static get instance() {
		if (!this._instance) this._instance = new SessionServiceInstance();
		return this._instance;
	}

	constructor() {
		super(SessionModel);
	}

	async findSessionForUserJwt(jwt: string, withPassword?: boolean) {
		const sessionPromise = this.model
			.findOne({
				jwt,
				type: "user",
			})
			.sort({ createdAt: -1 });
		if (withPassword) sessionPromise.select("+user.password");
		const session = await sessionPromise;
		return session;
	}

	async findSessionForAdmin(id: string, withPassword?: boolean) {
		const sessionPromise = this.model
			.findOne({
				"admin._id": id,
				type: "admin",
			})
			.sort({ createdAt: -1 });
		if (withPassword) sessionPromise.select("+admin.password");
		const session = await sessionPromise;
		return session;
	}
	
	async createAdminSession(admin: Admin, jwt: string) {
		return this.model.create({
			type: "admin",
			jwt,
			admin,
		});
	}

	async removeAdminSession(admin: Admin) {
		await this.model.deleteMany({
			"admin._id": admin._id,
		});
	}

	async createUserSession(user: User, jwt: string) {
		await this.model.create({
			jwt,
			user,
			type: "user",
		});
	}
}
class SessionServiceInstance extends SessionService {}