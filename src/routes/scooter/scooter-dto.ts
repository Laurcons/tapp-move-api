import * as cv from "class-validator";
import { IsArray, IsNumber, Length } from "class-validator";

export class FindNearQueryDTO {
    @cv.Matches(/^[0-9.]+\,[0-9.]+$/)
    location!: string;
}

export class ScooterCodeParamsDTO {
    @cv.IsString()
    @cv.Length(4)
    code!: string;
}

export class PingBodyDTO {
    @IsArray()
    @IsNumber({}, { each: true })
    location!: [number, number];
}