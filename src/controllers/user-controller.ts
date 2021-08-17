import express from "express";
import ApiError from "../errors/api-error";
import BodyApiError from "../errors/body-api-error";
import UserService from "../services/user-service";
import SessionService from '../services/session-service';

class UserController {
	userService = new UserService();

	register = async (req: express.Request, res: express.Response) => {
		const usernameRegex = /^[a-zA-Z0-9_-]{4,16}$/;
		const emailRegex = /^[a-z0-9_-]+\@[a-z0-9_-]+\.[a-z]+$/;
		if (!req.body.email)
			throw new BodyApiError("email", "not-present");
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
			throw new BodyApiError("email", "not-available", "This email is reserved.");
		}
        if (!(await this.userService.isPasswordSecure(password))) {
            throw new BodyApiError("password", "not-secure", "This password is not secure enough.");
        }
        // everything should be in order.
        const { jwt, user } = await this.userService.register({
            username, passwordRaw: password, email
        });
        res.json({
            status: "success",
            user: user.toObject(),
			token: jwt
        });
	};

    login = async (req: express.Request, res: express.Response) => {
		if (!req.body.email)
			throw new BodyApiError("email", "not-present");
		if (!req.body.password)
			throw new BodyApiError("password", "not-present");
		const email = req.body.email.trim() as string;
		const password = req.body.password.trim() as string;
		const user = await this.userService.findOne({ email });
		if (!user)
			throw new ApiError(400, "email-password-incorrect", "The email or password were incorrect");
		if (!this.userService.verifyPassword(password, user.password)) 
			throw new ApiError(400, "email-password-incorrect", "The email or password were incorrect");
		// everything should be fine then
		const { jwt, user: newUser } = await this.userService.login(user);
		res.json({
			status: "success",
			user: user.toObject(),
			token: jwt
		});
    }

	logout = async (req: express.Request, res: express.Response) => {
		this.userService.logout(req.session.user);
		res.json({
			status: "success"
		});
	}
}

export default new UserController();
