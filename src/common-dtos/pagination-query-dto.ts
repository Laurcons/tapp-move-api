import * as cv from "class-validator";

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
