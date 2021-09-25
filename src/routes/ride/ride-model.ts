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
	endLocation?: {
		type: "Point";
		coordinates: [number, number];
	};
    startAddress: string;
    endAddress?: string;
	startedAt: Date;
	endedAt?: Date;
	checkoutId?: string;
    price: number;
    distance: number;
    duration: number;
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
        coordinates: [Number, Number],
        required: false
    },
    startAddress: String,
    endAddress: {
        type: String,
        required: false
    },
    startedAt: {
        type: Date,
        default: Date.now
    },
    endedAt: {
        type: Date,
        required: false
    },
    checkoutId: {
        type: String,
        required: false
    },
    price: Number,
    distance: Number,
    duration: Number,
    scooterId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId
}, {
    toJSON: {
        transform: (doc: Ride, ret: any) => {
            ret.endLocation = doc.endLocation?.coordinates;
            ret.startLocation = doc.startLocation.coordinates;
        }
    }
});

rideSchema.index({ status: 1 }, { partialFilterExpression: { status: "ongoing" } });

export const RideModel = mongoose.model<Ride>("ride", rideSchema);