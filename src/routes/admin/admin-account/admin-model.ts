import mongoose from "mongoose";

export interface Admin extends mongoose.Document {
    email: string;
    password: string;
    lastLoginAt: Date;
}

export const adminSchema = new mongoose.Schema({
    email: String,
    password: {
        type: String,
        select: false
    },
    lastLoginAt: Date,
});

export const AdminModel = mongoose.model<Admin>("admin", adminSchema);