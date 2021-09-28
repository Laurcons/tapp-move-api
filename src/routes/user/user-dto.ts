import * as cv from "class-validator";
import { passwordRegex, usernameRegex } from "../auth/auth-dto";
export class UpdateBodyDTO {
    @cv.IsEmail()
    @cv.IsOptional()
    email?: string;

    @cv.Matches(usernameRegex)
    @cv.IsOptional()
    username?: string;

    @cv.Matches(passwordRegex)
    @cv.IsOptional()
    password?: string;

    @cv.IsString()
    oldPassword!: string;
}

export class ResetPasswordBodyDTO {
    @cv.IsString()
    password!: string;

    @cv.IsString()
    token!: string;
}

export class ForgotPasswordBodyDTO {
    @cv.IsEmail()
    email!: string;
}

export class RatingBodyDTO {
    @cv.IsIn(["ios", "android"])
    platform!: "ios" | "android";
    @cv.IsString()
    value!: string;
}