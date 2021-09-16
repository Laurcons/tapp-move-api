import * as cv from "class-validator";

export const usernameRegex = /^[a-zA-Z0-9-_.]{3,16}$/;
export const flaffRegex = /(^(?!.*flaf).*)/;
export const passwordRegex = /^.{4,}$/;

export class RegisterBodyDTO {
	@cv.IsString()
	@cv.Matches(usernameRegex, { message: "Your username can only contain 3 to 16 letters, numbers, dashes, underscores and dots."})
	@cv.Matches(flaffRegex, { message: "Flaff is not allowed to make accounts anymore. https://i.pinimg.com/originals/9c/df/7f/9cdf7f08b2a019b36f8bc86a857aa8e6.gif" })
	username!: string;

	@cv.IsEmail({}, { message: "The email is not valid." })
	@cv.Matches(flaffRegex, { message: "Flaff is not allowed to make accounts anymore. https://i.pinimg.com/originals/9c/df/7f/9cdf7f08b2a019b36f8bc86a857aa8e6.gif" })
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