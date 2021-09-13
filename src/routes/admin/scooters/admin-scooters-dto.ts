import * as cv from "class-validator";
import { IsObjectIdString } from "../../../dto-constraints/is-object-id-string";

export class ScooterIdParamsDTO {
    @IsObjectIdString()
    id!: string;
}

export class PaginationQueryDTO {
    @cv.IsNumberString()
    @cv.IsOptional()
    start?: string;

    @cv.IsNumberString()
    @cv.IsOptional()
    count?: string;
}

export class AddScooterBodyDTO {
	@cv.Matches(/^[A-Z0-9]{4}$/)
	code!: string;

    @cv.IsBoolean()
    isDummy!: boolean;

	@cv.Matches(/^[0-9]{15}$/)
	@cv.IsOptional()
	lockId?: string;

	@cv.IsArray()
	location!: [number, number];

	@cv.IsNumber()
	batteryLevel!: number;

	@cv.IsBoolean()
	isCharging!: boolean;

	@cv.IsBoolean()
	isUnlocked!: boolean;
}