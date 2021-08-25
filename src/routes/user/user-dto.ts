import * as cv from "class-validator";
import { passwordRegex, usernameRegex } from "../auth/auth-dto";

// export const updateValidator = Joi.object({
// 	body: Joi.object({
// 		email: Joi.string().email(),
// 		username: Joi.string().regex(usernameRegex),
// 		password: Joi.string().regex(passwordRegex),
// 		oldPassword: Joi.string(),
// 	}).with("password", "oldPassword"),
// });

export class UpdateBodyDTO {
    @cv.IsEmail()
    @cv.IsOptional()
    email!: string;

    @cv.Matches(usernameRegex)
    @cv.IsOptional()
    username!: string;

    @cv.Matches(passwordRegex)
    @cv.IsOptional()
    password!: string;

    @cv.IsString()
    oldPassword!: string;
}