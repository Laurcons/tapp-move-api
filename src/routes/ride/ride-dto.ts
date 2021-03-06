import * as cv from "class-validator";
import { PaginationQueryDTO } from "../../common-dtos/pagination-query-dto";
import { RideStatus, RideStatuses } from "./ride-model";

export class GetRidesQueryDTO extends PaginationQueryDTO {
    @cv.IsIn(RideStatuses)
    @cv.IsOptional()
    status?: RideStatus;
}

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