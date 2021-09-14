import * as cv from "class-validator";

export class SuspendUserBodyDTO {
	@cv.IsString()
	reason!: string;
}