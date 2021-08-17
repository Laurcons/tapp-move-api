
import mongoose from "mongoose";
import { User, userSchema } from "./user-model";

export interface Session extends mongoose.Document {
    jwt: string;
    createdAt: Date;
    expires: Date;
    type: "user" | "admin";
    user: User;
    admin: never;
}

export const sessionSchema = new mongoose.Schema({
    jwt: String,
    type: {
        type: String,
        enum: ["user", "admin"]
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expires: {
        type: Date,
        default: () => Date.now() + 1000 * 60 * 60 * 24 * 30 * 12 // 1 year
    },
    user: userSchema
});

export const SessionModel = mongoose.model<Session>("session", sessionSchema);