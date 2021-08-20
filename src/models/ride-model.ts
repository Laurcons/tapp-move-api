import mongoose from 'mongoose';

export interface Ride extends mongoose.Document {
	from: {
		type: "Point";
		coordinates: [number, number];
	};
	to?: {
		type: "Point";
		coordinates: [number, number];
	};
    startedAt: Date;
    endedAt?: Date;
	scooterId: mongoose.Types.ObjectId;
	userId: mongoose.Types.ObjectId;
	isFinished: boolean;
}

export const rideSchema = new mongoose.Schema({
    from: {
        type: { type: String },
        coordinates: [Number, Number]
    },
    to: {
        type: { type: String },
        coordinates: [Number, Number],
        required: false,
    },
    startedAt: {
        type: Date,
        default: Date.now
    },
    endedAt: {
        type: Date,
        required: false
    },
    scooterId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId,
    isFinished: Boolean
});

export const RideModel = mongoose.model<Ride>("ride", rideSchema);