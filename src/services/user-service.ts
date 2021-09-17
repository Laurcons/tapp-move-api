import bcrypt from "bcrypt";
import cryptoRandomString from "crypto-random-string";
import mongoose from "mongoose";
import ApiError from "../api-error";
import { User, UserModel } from "../routes/user/user-model";
import { JWTP } from "./../jwt-promise";
import AwsService from "./aws-service";
import CrudService from "./crud-service-base";
import EmailService from "./email-service";
import SessionService from "./session-service";

export default abstract class UserService extends CrudService<User> {
	sessionService = SessionService.instance;
	emailService = EmailService.instance;
	awsService = AwsService.instance;

	private static _instance: UserService | null = null;
	static get instance() {
		if (!this._instance) this._instance = new UserServiceInstance();
		return this._instance;
	}

	constructor() {
		super(UserModel);
	}

	/**
	 * @returns JWT token
	 */
	private async createSession(user: User) {
		// create jwt
		const jwt = await JWTP.sign({}, {
			subject: user._id.toString(),
		});
		// create session
		this.sessionService.createUserSession(user, jwt);
		return jwt;
	};

	private async isEmailAvailable(email: string) {
		const result = await this.model.findOne({
			email,
		});
		return !result;
	};

	private async verifyPassword(raw: string, hashed: string) {
		return await bcrypt.compare(raw, hashed);
	};

	private async hashPassword(raw: string) {
		return await bcrypt.hash(raw, 12);
	};

	async register(username: string, passwordRaw: string, email: string) {
		if (!(await this.isEmailAvailable(email))) {
			throw ApiError.users.emailUnavailable;
		}
		const hashed = await this.hashPassword(passwordRaw);
		const user = await this.model.create({
			email,
			password: hashed,
			username,
		});
		const jwt = await this.createSession(user);
		return {
			jwt,
			user,
		};
	};

	async login(email: string, password: string) {
		const user = await this.model.findOne({ email }).select("+password");
		if (!user) throw ApiError.users.passwordIncorrect;
		if (user.suspendedReason) {
			throw ApiError.users.userSuspended;
		}
		if (!(await this.verifyPassword(password, user.password)))
			throw ApiError.users.passwordIncorrect;
		// remove this step with caution: this step reselects the user without the
		//  password. omitting this step might send to the frontend the password field
		const newUser = await this.model.findOneAndUpdate(
			{ _id: user._id },
			{ $set: { lastLoginAt: new Date() } },
			{ new: true }
		) as User;
		const jwt = await this.createSession(newUser);
		return {
			jwt,
			user: newUser,
		};
	};

	async logout(user: User) {
		await this.sessionService.deleteOne({ _id: user._id });
	};

	async update(
		user: User,
		updates: {
			email?: string;
			password?: string;
			username?: string;
			oldPassword: string;
		}
	) {
		const { email, password, oldPassword } = updates;
		if (email) {
			if (!this.isEmailAvailable(email)) {
				throw ApiError.users.emailUnavailable;
			}
		}
		let hashedPassword = undefined;
		if (password) {
			if (!(await this.verifyPassword(oldPassword, user.password))) {
				throw ApiError.users.passwordIncorrect;
			}
			hashedPassword = await this.hashPassword(password);
		}
		const newUser = await this.model.findOneAndUpdate(
			{ _id: user._id },
			{
				$set: {
					...updates,
					password: hashedPassword,
				},
			},
			{ new: true }
		);
		if (!newUser) {
			throw new Error("This should never occur");
		}
		// update sessions
		await this.sessionService.updateMany({ "user._id": user._id }, {
			$set: {
				user: {
					...updates,
					password: hashedPassword,
				},
			},
		} as any);
		return newUser;
	};

	async beginForgotPassword(email: string) {
		const user = await this.model.findOne({ email });
		if (!user) return undefined;
		const token = cryptoRandomString({ length: 100 });
		// send email
		await this.emailService.sendForgotPasswordEmail(token);
		// user.forgotPasswordToken = token;
		// await user.save();
		await this.model.updateOne(
			{ _id: user._id },
			{ $set: { forgotPasswordToken: token } }
		);
		return token;
	};

	async findUserWithForgotPasswordToken(token: string) {
		const user = await this.model.findOne({ forgotPasswordToken: token });
		return user;
	};

	async updatePasswordWithToken(token: string, newPassword: string) {
		const user = await this.model.findOne({ forgotPasswordToken: token });
		if (!user) throw ApiError.users.userNotFound;
		const password = await this.hashPassword(newPassword);
		await this.model.updateOne(
			{ _id: user._id },
			{
				$set: { password },
				$unset: { forgotPasswordToken: 1 }
			}
		);
		
	};

	async uploadDriversLicense(user: User, image: Express.Multer.File) {
		const key = await this.awsService.uploadDriversLicense(user._id, image);
		await this.setDriversLicense(user._id, key);
	};

	async setDriversLicense(userId: mongoose.Types.ObjectId | string, key: string) {
		if (typeof userId === "string")
			userId = mongoose.Types.ObjectId(userId);
		const user = await this.model.findOneAndUpdate(
			{ _id: userId },
			{ $set: { driversLicenseKey: key, isLicenseValid: true } },
			{ new: true }
		);
		if (!user) throw ApiError.users.userNotFound;
		await this.sessionService.updateMany(
			{ "user._id": userId },
			{ $set: { user: user.toObject() } }
		);
	}

	async incrementRideCount(user: User) {
		const newUser = await this.model.findOneAndUpdate(
			{ _id: user._id },
			{ $inc: { totalRides: 1 } },
			{ new: true }
		);
		if (!newUser)
			throw ApiError.users.userNotFound;
		await this.sessionService.updateOne(
			{ "user._id": user._id },
			{ $set: { user: newUser } }
		);
	}

	async suspendUser(userId: string, reason: string) {
		const user = await this.model.findOneAndUpdate(
			{ _id: mongoose.Types.ObjectId(userId) },
			{ $set: { suspendedReason: reason } },
			{ new: true }
		);
		await this.sessionService.deleteMany(
			{ "user._id": mongoose.Types.ObjectId(userId) }
		);
		return user;
	}
}
class UserServiceInstance extends UserService {}