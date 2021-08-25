import { LoginBodyDTO } from './user-dto';
import express from "express";
import UserService from "../../services/user-service";
import { User } from "./user-model";
import SessionService from "../../services/session-service";
import { LeanDocument } from "mongoose";
import redact from "../../redact";
import ApiError from '../../errors/api-error';

const usernameRegex = /^[a-zA-Z0-9_-]{4,16}$/;
const emailRegex = /^[a-z0-9_-]+\@[a-z0-9_-]+\.[a-z]+$/;

class UserController {
	userService = new UserService();
	sessionService = new SessionService();

	register = async (
		req: express.Request<
			{},
			{},
			{ username: string; email: string; password: string }
		>,
		res: express.Response<
			{ status: string; token: string; user: Omit<LeanDocument<User>, "password"> }
		>
	) => {
		const { email, username, password } = req.body;
		// everything should be in order.
		const { jwt, user } = await this.userService.register(
			username,
			password,
			email
		);
		res.json({
			status: "success",
			user: redact(user, "password").toObject(),
			token: jwt,
		});
	};

	login = async (
		req: express.Request<{}, {}, LoginBodyDTO>, 
		res: express.Response<
			{ status: string; user: Omit<LeanDocument<User>, "password">, token: string; }
		>
	) => {
		const { email, password } = req.body;
		const { jwt, user } = await this.userService.login(email, password);
		res.json({
			status: "success",
			user,
			token: jwt,
		});
	};

	logout = async (
		req: express.Request<{}, {}, {}>, 
		res: express.Response<{status: string;}>
	) => {
		this.userService.logout(req.session.user);
		res.json({
			status: "success",
		});
	};

	getMe = async (
		req: express.Request<{}, {}, {}>,
		res: express.Response<{ status: string; user: Omit<LeanDocument<User>, "password"> }>
	) => {
		res.json({
			status: "success",
			user: redact(req.session.user.toObject(), "password"),
		});
	};

	beginForgotPassword = async (
		req: express.Request<{}, {}, { email: string; }>, 
		res: express.Response
	) => {
		const { email } = req.body;
		const result = await this.userService.beginForgotPassword(email);
		res.json({
			status: "success",
			"result[dev]": result
		});
	}

	endForgotPassword = async (req: express.Request, res: express.Response) => {
	}

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
