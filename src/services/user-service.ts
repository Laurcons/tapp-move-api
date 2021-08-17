import { User, UserModel } from "../models/user-model";
import CrudService from "./crud-service";
import bcrypt from "bcrypt";

export default class UserService extends CrudService<User> {
	constructor() {
		super(UserModel);
	}

	register = async (info: {
		username: string;
		passwordRaw: string;
		email: string;
	}) => {
        const hashed = await bcrypt.hash(info.passwordRaw, 12);
        const data = {
			email: info.email,
			password: hashed,
			username: info.username,
		};
		const result = await this.model.insertMany([data]);
        return result[0];
	};

	isEmailAvailable = async (email: string) => {
		const result = await this.model.findOne({
			email,
		});
		return !result;
	};

	isPasswordSecure = async (passwordRaw: string) => {
		return passwordRaw.length >= 4;
	};
}
