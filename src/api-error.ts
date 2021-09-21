
export default class ApiError extends Error {
	status: number;
	code: string;
	constructor(status: number, code: string, message?: string) {
		super(message);
		this.status = status;
		this.code = code;
	}

	static general = {
		invalidIdError: new ApiError(400, "invalid-id", "You supplied an invalid Id!"),
		actionNotAllowed: new ApiError(403, "not-allowed", "You are not allowed to perform this action, with these parameters."),
	};
	static users = {
		emailUnavailable: new ApiError(400, "email-not-available", "This email is not available."),
		userNotFound: new ApiError(400, "user-not-found", "The user wasn't found!"),
		emailPasswordIncorrect: new ApiError(400, "email-password-incorrect", "Your email or password is incorrect!"),
		passwordIncorrect: new ApiError(400, "password-incorrect", "The password is incorrect"),
		invalidToken: new ApiError(400, "invalid-token", "The received token (if at all received) is not valid. Try logging in again!"),
		userSuspended: new ApiError(400, "user-suspended", "This user is suspended."),
	};
	static scooters = {
		scooterCodeUnavailable: new ApiError(400, "scooter-code-unavailable", "The scooter code you provided is not available."),
		scooterNotFound: new ApiError(404, "scooter-not-found", "The scooter was not found"),
		tooFarAway: new ApiError(400, "too-far-away", "You are too far away to do this action"),
		scooterUnavailable: new ApiError(400, "scooter-unavailable", "This scooter is unavailable"),
		scooterTimeout: new ApiError(400, "scooter-timeout", "This scooter didn't respond. Try again!"),
	};
	static rides = {
		rideNotFound: new ApiError(404, "ride-not-found", "The ride wasn't found"),
	};
	static uploads = {
		fileNotUploaded: new ApiError(400, "file-not-uploaded", "You need to upload a file!"),
	};
	static stripe = {
		invalidSignature: new ApiError(400, "invalid-signature", "The request signature was invalid."),
	};
}