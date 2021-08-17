import express from "express";
import ApiError from "../errors/api-error";
import BodyApiError from "../errors/body-api-error";
import UserService from "../services/user-service";

class UserController {
	userService = new UserService();

	register = async (req: express.Request, res: express.Response) => {
		const usernameRegex = /^[a-zA-Z0-9_-]{4,16}$/;
		const emailRegex = /^[a-z0-9_-]+\@[a-z0-9_-]+\.[a-z]+$/;
		if (!req.body.email) throw new BodyApiError("email", "not-present");
		if (!req.body.password)
			throw new BodyApiError("password", "not-present");
		if (!req.body.username)
			throw new BodyApiError("username", "not-present");
		const email = req.body.email.trim();
		const password = req.body.password.trim();
		const username = req.body.username.trim();
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
        const data = await this.userService.register({
            username, passwordRaw: password, email
        });
        res.json({
            status: "success",
            user: data.toObject()
        })
	};
}

export default new UserController();
