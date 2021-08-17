import { Session, SessionModel } from "../models/session-model";
import CrudService from "./crud-service";

export default class SessionService extends CrudService<Session> {
	constructor() {
		super(SessionModel);
	}

	async findSessionForUser(id: string) {
		const session = await this.model.findOne({
			"user._id": id,
			type: "user",
		}).sort({ createdAt: -1 });
        return session;
	}
}
