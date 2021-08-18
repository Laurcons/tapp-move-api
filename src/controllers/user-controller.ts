import express from "express";
import ApiError from "../errors/api-error";
import BodyApiError from "../errors/body-api-error";
import UserService from "../services/user-service";
import cryptoRandomString from "crypto-random-string";
import { User } from "../models/user-model";
import SessionService from "../services/session-service";

const usernameRegex = /^[a-zA-Z0-9_-]{4,16}$/;
const emailRegex = /^[a-z0-9_-]+\@[a-z0-9_-]+\.[a-z]+$/;

class UserController {
	userService = new UserService();
	sessionService = new SessionService();

	register = async (req: express.Request, res: express.Response) => {
		if (!req.body.email) throw new BodyApiError("email", "not-present");
		if (!req.body.password)
			throw new BodyApiError("password", "not-present");
		if (!req.body.username)
			throw new BodyApiError("username", "not-present");
		const email = req.body.email.trim() as string;
		const password = req.body.password.trim() as string;
		const username = req.body.username.trim() as string;
		if (!usernameRegex.test(username)) {
			throw new BodyApiError(
				"username",
				"not-acceptable",
				`Must follow the regex ${usernameRegex}`
			);
		}
		if (!emailRegex.test(email)) {
			throw new BodyApiError(
				"email",
				"not-acceptable",
				`Must follow the regex ${emailRegex}`
			);
		}
		if (!(await this.userService.isEmailAvailable(email))) {
			throw new BodyApiError(
				"email",
				"not-available",
				"This email is reserved."
			);
		}
		if (!(await this.userService.isPasswordSecure(password))) {
			throw new BodyApiError(
				"password",
				"not-secure",
				"This password is not secure enough."
			);
		}
		// everything should be in order.
		const { jwt, user } = await this.userService.register({
			username,
			passwordRaw: password,
			email,
		});
		res.json({
			status: "success",
			user: user.toObject(),
			token: jwt,
		});
	};

	login = async (req: express.Request, res: express.Response) => {
		if (!req.body.email) throw new BodyApiError("email", "not-present");
		if (!req.body.password)
			throw new BodyApiError("password", "not-present");
		const email = req.body.email.trim() as string;
		const password = req.body.password.trim() as string;
		const user = await this.userService.findOne({ email });
		if (!user)
			throw new ApiError(
				400,
				"email-password-incorrect",
				"The email or password were incorrect"
			);
		if (!await this.userService.verifyPassword(password, user.password))
			throw new ApiError(
				400,
				"email-password-incorrect",
				"The email or password were incorrect"
			);
		// everything should be fine then
		const { jwt, user: newUser } = await this.userService.login(user);
		let userRedacted = newUser.toObject() as any;
		userRedacted.password = undefined;
		res.json({
			status: "success",
			user: userRedacted,
			token: jwt,
		});
	};

	logout = async (req: express.Request, res: express.Response) => {
		this.userService.logout(req.session.user);
		res.json({
			status: "success",
		});
	};

	getMe = async (req: express.Request, res: express.Response) => {
		let userRedacted = req.session.user.toObject() as any;
		userRedacted.password = undefined;
		res.json({
			status: "success",
			user: userRedacted,
		});
	}

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

	update = async (req: express.Request, res: express.Response) => {
		let updateObject: Record<string, string> = {};
		if (typeof req.body.email === "string") {
			if (!emailRegex.test(req.body.email)) {
				throw new BodyApiError("email", "not-acceptable");
			}
			if (!this.userService.isEmailAvailable(req.body.email)) {
				throw new BodyApiError("email", "not-available");
			}
			updateObject.email = req.body.email;
		}
		if (typeof req.body.username === "string") {
			if (!usernameRegex.test(req.body.username)) {
				throw new BodyApiError("username", "not-acceptable");
			}
			updateObject.username = req.body.username;
		}
		if (typeof req.body.password === "string") {
			if (typeof req.body.oldPassword !== "string") {
				throw new BodyApiError("oldPassword", "not-present");
			}
			// verify old password
			if (!await this.userService.verifyPassword(req.body.oldPassword, req.session.user.password)) {
				throw new BodyApiError("password", "incorrect");
			}
			// change to new password
			updateObject.password = await this.userService.hashPassword(
				req.body.password
			);
		}
		const newUser = Object.assign(
			{},
			req.session.user.toObject(),
			updateObject
		);
		// update object
		await this.userService.updateOne(
			{ _id: newUser._id },
			{ $set: updateObject }
		);
		console.log({newUser});
		// also update the snapshot from the session object
		await this.sessionService.updateMany(
			{ "user._id": newUser._id },
			{ $set: { user: newUser } }
		);
		let redactedUser = newUser as any;
		redactedUser.password = undefined;
		res.json({
			status: "success",
			user: redactedUser
		});
	}
}

export default new UserController();
