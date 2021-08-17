import BodyApiError from "./body-api-error";

export default class InvalidIdError extends BodyApiError {
    constructor() {
        super("id//somewhere", "invalid-id", "Invalid id!");
    }
}