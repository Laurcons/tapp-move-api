import express from "express";
import ApiError from "../../api-error";
import SessionService from "../../services/session-service";
import UserService from "../../services/user-service";
import { ForgotPasswordBodyDTO, ResetPasswordBodyDTO, UpdateBodyDTO } from "./user-dto";
import { User } from "./user-model";

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
		await this.userService.uploadDriversLicense(req.session.user, req.file);
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
