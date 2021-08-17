import ApiError from "./api-error";

export default class AuthenticationError extends ApiError {
    constructor(code: string, message?: string) {
        super(403, code, message);
    }
}