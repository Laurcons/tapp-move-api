import express from "express";
import { LeanDocument } from "mongoose";
import SessionService from "../../services/session-service";
import UserService from "../../services/user-service";
import { User } from "../user/user-model";
import { BeginForgotPasswordBodyDTO, LoginBodyDTO, RegisterBodyDTO } from "./auth-dto";

class AuthController {
	userService = new UserService();
	sessionService = new SessionService();

	register = async (
		req: express.Request<{}, {}, RegisterBodyDTO>,
		res: express.Response<{
			status: string;
			token: string;
			user: Omit<LeanDocument<User>, "password">;
		}>
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
			user: user,
			token: jwt,
		});
	};

	login = async (
		req: express.Request<{}, {}, LoginBodyDTO>,
		res: express.Response<{
			status: string;
			user: Omit<LeanDocument<User>, "password">;
			token: string;
		}>
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
		req: express.Request,
		res: express.Response<{ status: string }>
	) => {
		this.userService.logout(req.session.user);
		res.json({
			status: "success",
		});
	};

	beginForgotPassword = async (
		req: express.Request<{}, {}, BeginForgotPasswordBodyDTO>,
		res: express.Response
	) => {
		const { email } = req.body;
		const result = await this.userService.beginForgotPassword(email);
		res.json({
			status: "success",
			"result[dev]": result,
		});
	};

	endForgotPassword = async (
		req: express.Request,
		res: express.Response
	) => {};
}

export default new AuthController();
