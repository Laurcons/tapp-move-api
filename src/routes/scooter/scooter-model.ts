import mongoose from "mongoose";

export interface Scooter extends mongoose.Document {
	status: "unavailable" | "booked" | "available";
	code: string; // a 4-character code
	isDummy: boolean;
	lockId: string;
	location: {
		type: "Point";
		coordinates: [number, number];
	};
	batteryLevel: number;
	isCharging: boolean;
	isUnlocked: boolean;
}

export const scooterSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ["unavailable", "booked", "available"]
    },
    code: {
        type: String,
        validate: /^[A-Z0-9]{4}$/
    },
    isDummy: Boolean,
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
}, {
    toJSON: {
        transform: (doc: Scooter, ret: any) => {
            ret.location = doc.location.coordinates;
        }
    }
});

scooterSchema.index({ status: 1 }, { partialFilterExpression: { status: "available" } });

export const ScooterModel = mongoose.model<Scooter>("scooter", scooterSchema);