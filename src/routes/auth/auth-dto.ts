import * as cv from "class-validator";

const usernameRegex = /^[a-zA-Z0-9-_.]{3,16}$/;
const passwordRegex = /^.{4,}$/;

export class RegisterBodyDTO {
	@cv.IsString()
	@cv.Matches(usernameRegex)
	username!: string;

	@cv.IsEmail()
	email!: string;

	@cv.IsString()
	@cv.Matches(passwordRegex)
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