import { Session, SessionModel } from "../routes/user/session-model";
import CrudService from "./crud-service";

export default class SessionService extends CrudService<Session> {
	constructor() {
		super(SessionModel);
	}

	async findSessionForUser(id: string, withPassword?: boolean) {
		const sessionPromise = this.model.findOne({
			"user._id": id,
			type: "user",
		}).sort({ createdAt: -1 });
		if (withPassword)
			sessionPromise.select("+user.password");
		const session = await sessionPromise;
        return session;
	}
}
