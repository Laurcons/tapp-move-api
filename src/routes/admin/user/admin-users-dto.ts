import * as cv from "class-validator";
import { IsObjectIdString } from "../../../dto-constraints/is-object-id-string";

export class UserIdParamsDTO {
    @IsObjectIdString()
    id!: string;
}