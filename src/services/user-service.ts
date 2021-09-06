import { JWTP } from "./../jwt-promise";
import { User, UserModel } from "../routes/user/user-model";
import CrudService from "./crud-service-base";
import bcrypt from "bcrypt";
import SessionService from "./session-service";
import Config from "../environment";
import ApiError from "../api-error";
import cryptoRandomString from "crypto-random-string";
import EmailService from "./email-service";
import AwsService from "./aws-service";

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
	private createSession = async (user: User) => {
		// create jwt
		const jwt = await JWTP.sign({}, Config.get("AUTH_SECRET"), {
			subject: user._id.toString(),
		});
		// create session
		const session = await this.sessionService.insert({
			jwt,
			user,
			type: "user",
		});
		return jwt;
	};

	private isEmailAvailable = async (email: string) => {
		const result = await this.model.findOne({
			email,
		});
		return !result;
	};

	private verifyPassword = async (raw: string, hashed: string) => {
		return await bcrypt.compare(raw, hashed);
	};

	private hashPassword = async (raw: string) => {
		return await bcrypt.hash(raw, 12);
	};

	register = async (username: string, passwordRaw: string, email: string) => {
		if (!(await this.isEmailAvailable(email))) {
			throw ApiError.emailNotAvailable;
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

	login = async (email: string, password: string) => {
		const user = await this.model.findOne({ email }).select("+password");
		if (!user) throw ApiError.emailPasswordIncorrect;
		if (!(await this.verifyPassword(password, user.password)))
			throw ApiError.emailPasswordIncorrect;
		const jwt = await this.createSession(user);
		return {
			jwt,
			user,
		};
	};

	logout = async (user: User) => {
		await this.sessionService.deleteOne({ _id: user._id });
	};

	update = async (
		user: User,
		updates: {
			email?: string;
			password?: string;
			username?: string;
			oldPassword: string;
		}
	) => {
		// const updateObject: Record<string, string> = {};
		const { email, password, oldPassword } = updates;
		if (email) {
			if (!this.isEmailAvailable(email)) {
				throw ApiError.emailNotAvailable;
			}
		}
		let hashedPassword = undefined;
		if (password) {
			if (!(await this.verifyPassword(oldPassword, user.password))) {
				throw ApiError.passwordIncorrect;
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

	beginForgotPassword = async (email: string) => {
		const user = await this.model.findOne({ email });
		if (!user) return undefined;
		const token = cryptoRandomString({ length: 100 });
		// send email
		// await this.emailService.sendForgotPasswordEmail();
		// user.forgotPasswordToken = token;
		// await user.save();
		await this.model.updateOne(
			{ _id: user._id },
			{ $set: { forgotPasswordToken: token } }
		);
		return token;
	};

	findUserWithForgotPasswordToken = async (token: string) => {
		const user = await this.model.findOne({ forgotPasswordToken: token });
		return user;
	};

	updatePasswordWithToken = async (token: string, newPassword: string) => {
		const user = await this.model.findOne({ forgotPasswordToken: token });
		if (!user) throw ApiError.userNotFound;
		const password = await this.hashPassword(newPassword);
		// forgotPasswordToken = undefined;
		// await this.sessionService.deleteOne({ userId: user._id });
		// await user.save();
		await this.model.updateOne(
			{ _id: user._id },
			{
				$set: { password },
				$unset: { forgotPasswordToken: 1 }
			}
		);
		
	};

	uploadDriversLicense = async (user: User, image: Express.Multer.File) => {
		const key = await this.awsService.uploadDriversLicense(user._id, image);
		await this.model.updateOne(
			{ _id: user._id },
			{ $set: { driversLicenseKey: key } }
		);
	};
}
class UserServiceInstance extends UserService {}