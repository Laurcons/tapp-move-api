import * as cv from "class-validator";

export class LocationQueryDTO {
	@cv.Matches(/^[0-9.]+\,[0-9.]+/)
	location!: string;
}

export class ToggleLockBodyDTO {
    @cv.IsBoolean()
    lock!: boolean;
}