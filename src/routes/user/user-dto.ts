import { IsEmail, IsString, Matches } from "class-validator";
import { User } from "./user-model";

const usernameRegex = /^[a-zA-Z0-9-_.]{3,16}$/;
const passwordRegex = /^.{4,}$/;

export class RegisterBodyDTO {
	@IsString()
	@Matches(usernameRegex)
	username!: string;

    @IsEmail()
	email!: string;

    @IsString()
    @Matches(passwordRegex)
	password!: string;
}

export class LoginBodyDTO {
	@IsEmail()
	email!: string;
	@IsString()
	password!: string;
}