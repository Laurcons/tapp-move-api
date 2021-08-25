import * as cv from "class-validator";

export class StartRideBodyDTO {
    @cv.IsString()
    @cv.Length(4)
    code!: string;

    @cv.IsArray()
    @cv.IsNumber({}, { each: true })
    @cv.Length(2)
    @cv.IsOptional()
    location?: [number, number];
}

export class StartRideQueryDTO {
    @cv.IsBooleanString()
    @cv.IsOptional()
    isNFC?: string;
}

export class LocationQueryDTO {
	@cv.Matches(/^[0-9.]+\,[0-9.]+/)
	location!: string;
}

export class ToggleLockBodyDTO {
    @cv.IsBoolean()
    lock!: boolean;
}