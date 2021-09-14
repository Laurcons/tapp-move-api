import { IsObjectIdString } from "../dto-constraints/is-object-id-string";

export class IdParamsDTO {
	@IsObjectIdString()
	id!: string;
}
