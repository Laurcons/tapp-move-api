import express from "express";
import UserService from "../../services/user-service";
import { User } from "./user-model";
import SessionService from "../../services/session-service";
import { LeanDocument } from "mongoose";
import redact from "../../redact";
import ApiError from '../../errors/api-error';

class UserController {
	userService = new UserService();
	sessionService = new SessionService();

	getMe = async (
		req: express.Request<{}, {}, {}>,
		res: express.Response<{ status: string; user: Omit<LeanDocument<User>, "password"> }>
	) => {
		res.json({
			status: "success",
			user: redact(req.session.user.toObject(), "password"),
		});
	};

	update = async (
		req: express.Request<
			{}, {},
			{ password?: string; oldPassword?: string; email?: string; username?: string; }
		>, 
		res: express.Response<
			{ status: string; user: Omit<LeanDocument<User>, "password"> }
		>
	) => {
		const newUser = await this.userService.update(req.session.user, req.body);
		console.log({ newUser });
		res.json({
			status: "success",
			user: redact(newUser, "password").toObject(),
		});
	};

	uploadDriversLicense = async (
		req: express.Request,
		res: express.Response<{status: string; }>
	) => {
		if (!req.file)
			throw ApiError.fileNotUploaded;
		this.userService.uploadDriversLicense(req.session.user, req.file);
		res.json({
			status: "success"
		});
	}
}

export default new UserController();
