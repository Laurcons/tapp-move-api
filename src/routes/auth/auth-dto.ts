import * as cv from "class-validator";

export const usernameRegex = /^[a-zA-Z0-9-_.]{3,16}$/;
export const passwordRegex = /^.{4,}$/;

export class RegisterBodyDTO {
	@cv.IsString()
	@cv.Matches(usernameRegex, { message: "Your username can only contain 3 to 16 letters, numbers, dashes, underscores and dots."})
	username!: string;

	@cv.IsEmail({}, { message: "The email is not valid." })
	email!: string;

	@cv.IsString()
	@cv.Matches(passwordRegex, { message: "Your password needs to be least 4 characters long." })
	password!: string;
}

export class LoginBodyDTO {
	@cv.IsEmail()
	email!: string;
	@cv.IsString()
	password!: string;
}

export class BeginForgotPasswordBodyDTO {
	@cv.IsEmail()
	email!: string;
}