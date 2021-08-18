import { JWTP } from './../jwt-promise';
import { User, UserModel } from "../models/user-model";
import CrudService from "./crud-service";
import bcrypt from "bcrypt";
import SessionService from "./session-service";
import Config from '../environment';
import mongoose from "mongoose";

export default class UserService extends CrudService<User> {
	sessionService = new SessionService();

	constructor() {
		super(UserModel);
	}

	register = async (info: {
		username: string;
		passwordRaw: string;
		email: string;
	}) => {
		const hashed = this.hashPassword(info.passwordRaw);
		const data = {
			email: info.email,
			password: hashed,
			username: info.username,
		};
		const result = await this.model.insertMany([data]);
		return this.login(result[0]);
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

	login = async (user: User) => {
		// create jwt
		const jwt = await JWTP.sign({}, Config.get("AUTH_SECRET"), {
			subject: user._id.toString(),
		});
		// create session
		const session = await this.sessionService.insert({
			jwt,
			user,
			type: "user",
		});
		return {
			jwt,
			user,
		};
	};

	logout = async (user: User) => {
		await this.sessionService.deleteOne({ _id: user._id });
	};

	verifyPassword = async (raw: string, hashed: string) => {
		return await bcrypt.compare(raw, hashed);
	};

	hashPassword = async (raw: string) => {
		return await bcrypt.hash(raw, 12);
	};

	attachForgotPasswordToken = async (token: string, user: User) => {
		await this.model.updateOne(
			{ _id: user._id },
			{ $set: { forgotPasswordToken: token } }
		);
	};

	findUserWithForgotPasswordToken = async (token: string) => {
		// find user in db
		const user = await this.model.findOne({
			forgotPasswordToken: token,
		});
		return user;
	};
}
