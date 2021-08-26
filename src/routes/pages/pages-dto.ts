import { IsString } from "class-validator";

export class ForgotPasswordTokenQueryDTO {
    @IsString() 
    token?: string;
}