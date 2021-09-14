import * as cv from "class-validator";

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