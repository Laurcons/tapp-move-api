import { LoginBodyDTO } from './user-dto';
import express from "express";
import UserService from "../../services/user-service";
import { User } from "./user-model";
import SessionService from "../../services/session-service";
import { LeanDocument } from "mongoose";
import redact from "../../redact";

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
			user: redact(user.toObject(), "password"),
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
			user: redact(req.session.user, "password").toObject(),
		});
	};

	// not finished
	// beginForgotPassword = async (req: express.Request, res: express.Response) => {
	// 	if (!req.body.email) {
	// 		throw new BodyApiError("email", "not-present");
	// 	}
	// 	const email = req.body.email.trim() as string;
	// 	// try and find user
	// 	const user = await this.userService.findOne({
	// 		email
	// 	});
	// 	if (!user) {
	// 		throw new BodyApiError("email", "user-not-found");
	// 	}
	// 	// generate token
	// 	const token = cryptoRandomString({ length: 100, type: "alphanumeric"});
	// 	// add token to db
	// 	this.userService.attachForgotPasswordToken(token, user);
	// 	// now send an email, but for the purposes of developent just send it back in the request
	// 	res.json({
	// 		status: "success",
	// 		"token-that-should-have-been-sent-in-an-email": token
	// 	});
	// }

	// not finished
	// endForgotPassword = async (req: express.Request, res: express.Response) => {
	// 	if (!req.query.token) {
	// 		throw new BodyApiError("token", "not-present");
	// 	}
	// 	const user = await this.userService.findUserWithForgotPasswordToken(req.body.token);
	// 	if (!user) {
	// 		throw new BodyApiError("token", "invalid-token");
	// 	}
	// }

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
}

export default new UserController();
