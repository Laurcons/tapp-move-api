import Joi from "joi";

const usernameRegex = /^[a-zA-Z0-9-_.]{3,16}$/;
const passwordRegex = /^.{4,}$/;

export const loginValidator = Joi.object({
	body: Joi.object({
		email: Joi.string()
            .email()
            .required(),
		password: Joi.string()
            .required(),
	}),
});

export const registerValidator = Joi.object({
	body: Joi.object({
		email: Joi.string()
            .email()
            .required(),
		password: Joi.string()
            .regex(passwordRegex).message("Your password is not secure enough!")
            .required(),
		username: Joi.string()
            .regex(usernameRegex)
            .required(),
	}),
});

export const updateValidator = Joi.object({
    body: Joi.object({
        email: Joi.string()
            .email(),
        username: Joi.string()
            .regex(usernameRegex),
        password: Joi.string()
            .regex(passwordRegex),
        oldPassword: Joi.string(),
    }).with("password", "oldPassword")
});