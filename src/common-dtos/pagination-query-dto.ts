import * as cv from "class-validator";

export class PaginationQueryDTO {
	@cv.IsNumberString()
	@cv.IsOptional()
	start?: string;

	@cv.IsNumberString()
	@cv.IsOptional()
	count?: string;
}
