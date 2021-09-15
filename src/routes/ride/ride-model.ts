import mongoose from 'mongoose';

export type RideStatus = "ongoing" | "payment-pending" | "payment-initiated" | "completed";
export const RideStatuses = ["ongoing", "payment-pending", "payment-initiated", "completed"];

export interface Ride extends mongoose.Document {
	status: RideStatus;
	route: [[number, number]];
	startLocation: {
		type: "Point";
		coordinates: [number, number];
	};
	endLocation: {
		type: "Point";
		coordinates: [number, number];
	};
	startedAt: Date;
	endedAt?: Date;
	checkoutRecoveryUrl?: string;
	scooterId: mongoose.Types.ObjectId;
	userId: mongoose.Types.ObjectId;
}

export const rideSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: RideStatuses,
    },
    route: [[Number, Number]],
    startLocation: {
        type: { type: String, default: "Point" },
        coordinates: [Number, Number]
    },
    endLocation: {
        type: { type: String, default: "Point" },
        coordinates: [Number, Number]
    },
    startedAt: {
        type: Date,
        default: Date.now
    },
    endedAt: {
        type: Date,
        required: false
    },
    checkoutRecoveryUrl: {
        type: String,
        required: false
    },
    scooterId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId
}, {
    toJSON: {
        transform: (doc: Ride, ret: any) => {
            ret.endLocation = doc.endLocation.coordinates;
            ret.startLocation = doc.startLocation.coordinates;
        }
    }
});

rideSchema.index({ status: 1 }, { partialFilterExpression: { status: "ongoing" } });

export const RideModel = mongoose.model<Ride>("ride", rideSchema);