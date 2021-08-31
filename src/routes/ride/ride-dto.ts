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

export class PatchBodyDTO {
	@cv.IsBoolean()
	@cv.IsOptional()
	lock?: boolean;

	@cv.IsBoolean()
	@cv.IsOptional()
	headlights?: boolean;
    
	@cv.IsBoolean()
	@cv.IsOptional()
	taillights?: boolean;
}

export class PaginationQueryDTO {
    @cv.IsNumberString()
    @cv.IsPositive()
    @cv.IsOptional()
    start?: string;

    @cv.IsNumberString()
    @cv.IsPositive()
    @cv.Max(20)
    @cv.IsOptional()
    count?: string;
}