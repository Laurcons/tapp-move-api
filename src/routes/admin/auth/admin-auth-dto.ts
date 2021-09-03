import * as cv from "class-validator";

export class LoginBodyDTO {
    @cv.IsEmail()
    email!: string;

    @cv.IsString()
    password!: string;
}