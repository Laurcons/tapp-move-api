
export default class ApiError extends Error {
    status: number;
    code: string;
    constructor(status: number, code: string, message?: string) {
        super(message);
        this.status = status;
        this.code = code;
    }

    static emailNotAvailable = new ApiError(400, "email-not-available", "This email is not available.");
    /** Only thrown at login */
    static emailPasswordIncorrect = new ApiError(400, "email-password-incorrect", "Your email or password is incorrect!");
    static passwordIncorrect = new ApiError(400, "password-incorrect", "The password is incorrect");
}