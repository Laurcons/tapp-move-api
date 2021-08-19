import { Joi } from "express-validation";

const usernameRegex = /^[a-zA-Z0-9-_.]{3,16}$/;
const passwordRegex = /^.{4,}$/;

export const loginValidator = {
	body: Joi.object({
		email: Joi.string()
            .email()
            .required(),
		password: Joi.string()
            .required(),
	}),
};

export const registerValidator = {
	body: Joi.object({
		email: Joi.string()
            .email()
            .required(),
		password: Joi.string()
            .regex(passwordRegex).message("Your password is not secure enough!"),
		username: Joi.string()
            .regex(usernameRegex),
	}),
};

export const updateValidator = {
    body: Joi.object({
        email: Joi.string()
            .email(),
        username: Joi.string()
            .regex(usernameRegex),
        password: Joi.string()
            .regex(passwordRegex),
        oldPassword: Joi.string(),
    }).with("password", "oldPassword")
}