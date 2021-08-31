import { Session, SessionModel } from "../routes/user/session-model";
import CrudService from "./crud-service";

export default abstract class SessionService extends CrudService<Session> {
	private static _instance: SessionService | null = null;
	static get instance() {
		if (!this._instance) this._instance = new SessionServiceInstance();
		return this._instance;
	}

	constructor() {
		super(SessionModel);
	}

	async findSessionForUser(id: string, withPassword?: boolean) {
		const sessionPromise = this.model
			.findOne({
				"user._id": id,
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
}
class SessionServiceInstance extends SessionService {}