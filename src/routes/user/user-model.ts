import mongoose from 'mongoose';

export interface User extends mongoose.Document {
	suspendedReason: string | undefined;
    email: string;
    username: string;
    password: string;
    lastLoginAt: Date;
    registeredAt: Date;
	totalRides: number;
	forgotPasswordToken?: string;
	driversLicenseKey?: string;
	isLicenseValid?: boolean;
}

export const userSchema = new mongoose.Schema({
	suspendedReason: {
		type: String,
		required: false
	},
	email: String,
	username: String,
	password: {
		type: String,
		select: false
	},
	lastLoginAt: {
		type: Date,
		default: Date.now,
	},
	registeredAt: {
		type: Date,
		default: Date.now,
	},
	totalRides: {
		type: Number,
		default: 0
	},
	forgotPasswordToken: {
		type: String,
		required: false
	},
	driversLicenseKey: {
		type: String,
		required: false
	},
	isLicenseValid: {
		type: Boolean,
		required: false
	},
});

export const UserModel = mongoose.model<User>("user", userSchema);