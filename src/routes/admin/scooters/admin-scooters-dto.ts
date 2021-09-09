import * as cv from "class-validator";
import { IsObjectIdString } from "../../../dto-constraints/is-object-id-string";

export class ScooterIdParamsDTO {
    @IsObjectIdString()
    id!: string;
}