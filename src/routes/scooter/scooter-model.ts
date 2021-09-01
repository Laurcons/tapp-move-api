import mongoose from "mongoose";

export interface Scooter extends mongoose.Document {
	code: string; // a 4-character code
    lockId: string;
	location: {
        type: "Point",
		coordinates: [number, number];
	};
    batteryLevel: number;
    isUnlocked: boolean;
    isBooked: boolean;
}

export const scooterSchema = new mongoose.Schema({
    code: String,
    lockId: String,
    location: {
        type: {
            type: String,
            default: "Point"
        },
        coordinates: [
            Number, Number
        ]
    },
    batteryLevel: Number,
    isCharging: Boolean,
    isUnlocked: Boolean,
    isBooked: Boolean,
});

export const ScooterModel = mongoose.model<Scooter>("scooter", scooterSchema);