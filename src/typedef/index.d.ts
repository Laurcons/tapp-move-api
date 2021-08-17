import { Session } from "../models/session-model";


declare global {
	namespace Express {
		interface Request {
			session: Session;
		}
	}
}