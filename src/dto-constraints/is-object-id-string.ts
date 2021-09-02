import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";

@ValidatorConstraint({ async: false })
class IsObjectIdStringConstraint implements ValidatorConstraintInterface {

    validate(value: any, validationArguments?: ValidationArguments): boolean | Promise<boolean> {
        if (typeof value !== "string")
            return false;
        return /^[0-9A-Fa-f]{24}$/.test(value);
    }

    defaultMessage() {
        return "The id provided is not formatted correctly: it must be a string of 24 hex characters";
    }

}

/**
 * Checks whether the value is a string and whether it's a string of 24 hex characters (an ObjectId)
 */
export function IsObjectIdString(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsObjectIdStringConstraint
        })
    }
}