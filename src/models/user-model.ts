import mongoose from 'mongoose';

export interface User extends mongoose.Document {
    email: string;
    username: string;
    password: string;
    lastLoginAt: Date;
    registeredAt: Date;
	forgotPasswordToken?: string;
}

export const userSchema = new mongoose.Schema({
	email: String,
	username: String,
	password: String,
	lastLoginAt: {
		type: Date,
		default: Date.now,
	},
	registeredAt: {
		type: Date,
		default: Date.now,
	},
	forgotPasswordToken: {
		type: String,
		required: false
	}
});

export const UserModel = mongoose.model<User>("user", userSchema);