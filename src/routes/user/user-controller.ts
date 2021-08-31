import express from "express";
import UserService from "../../services/user-service";
import { User } from "./user-model";
import SessionService from "../../services/session-service";
import ApiError from "../../errors/api-error";
import { ForgotPasswordBodyDTO, ResetPasswordBodyDTO, UpdateBodyDTO } from "./user-dto";

class UserController {
	userService = UserService.instance;
	sessionService = SessionService.instance;

	getMe = async (
		req: express.Request,
		res: express.Response<{
			status: string;
			user: User;
		}>
	) => {
		res.json({
			status: "success",
			user: req.session.user,
		});
	};

	update = async (
		req: express.Request<{}, {}, UpdateBodyDTO>,
		res: express.Response<{
			status: string;
			user: User;
		}>
	) => {
		const newUser = await this.userService.update(
			req.session.user,
			req.body
		);
		console.log({ newUser });
		res.json({
			status: "success",
			user: newUser,
		});
	};

	uploadDriversLicense = async (
		req: express.Request,
		res: express.Response<{ status: string }>
	) => {
		if (!req.file) throw ApiError.fileNotUploaded;
		this.userService.uploadDriversLicense(req.session.user, req.file);
		res.json({
			status: "success",
		});
	};

	forgotPassword = async (
		req: express.Request<{}, {}, ForgotPasswordBodyDTO>,
		res: express.Response<{ status: string; } & Record<string, string | undefined>>
	) => {
		const { email } = req.body;
		const token = await this.userService.beginForgotPassword(email);
		res.json({
			status: "success",
			"token-that-should-have-been-sent-through-email": token
		});
	};

	resetPassword = async (
		req: express.Request<{}, {}, ResetPasswordBodyDTO>,
		res: express.Response<{ status: string; }>
	) => {
		const { token, password } = req.body;
		await this.userService.updatePasswordWithToken(token, password);
		res.json({
			status: "success"
		});
	};
}

export default new UserController();
