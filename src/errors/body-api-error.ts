import ApiError from "./api-error";

export default class BodyApiError extends ApiError {
    field: string;
    constructor(field: string, code: string, message: string = "The field was invalid.") {
        super(422, code, message);
        this.field = field;
    }
}