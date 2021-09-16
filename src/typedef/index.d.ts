import { Session } from "../routes/user/session-model";


declare global {
	namespace Express {
		interface Request {
			session: Session;
			rawBody: any;
		}
	}
}