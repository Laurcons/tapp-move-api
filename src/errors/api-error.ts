
export default class ApiError extends Error {
    status: number;
    code: string;
    constructor(status: number, code: string, message?: string) {
        super(message);
        this.status = status;
        this.code = code;
    }

    static invalidIdError = new ApiError(400, "invalid-id", "You supplied an invalid Id!");
    static emailNotAvailable = new ApiError(400, "email-not-available", "This email is not available.");
    static actionNotAllowed = new ApiError(403, "not-allowed", "You are not allowed to perform this action, with these parameters.");
    /** Only thrown at login */
    static emailPasswordIncorrect = new ApiError(400, "email-password-incorrect", "Your email or password is incorrect!");
    static passwordIncorrect = new ApiError(400, "password-incorrect", "The password is incorrect");
    static scooterNotFound = new ApiError(404, "scooter-not-found", "The scooter was not found");
    static rideNotFound = new ApiError(404, "ride-not-found", "The ride wasn't found");
    static tooFarAway = new ApiError(400, "too-far-away", "You are too far away to do this action");
    static alreadyRiding = new ApiError(400, "already-riding", "You are already riding a scooter");
    static scooterUnavailable = new ApiError(400, "scooter-unavailable", "This scooter is unavailable");
}