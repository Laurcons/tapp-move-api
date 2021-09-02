import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";
/**
 * Checks whether the value is a string and whether it's a string of 24 hex characters (an ObjectId)
 */
@ValidatorConstraint({ name: "isObjectIdString", async: false })
export class IsObjectIdString implements ValidatorConstraintInterface {

    validate(value: any, validationArguments?: ValidationArguments): boolean | Promise<boolean> {
        if (typeof value !== "string")
            return false;
        return /^[0-9A-Fa-f]{24}$/.test(value);
    }

    defaultMessage() {
        return "The id provided is not formatted correctly: it must be a string of 24 hex characters";
    }

}