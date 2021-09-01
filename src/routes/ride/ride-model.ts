import mongoose from 'mongoose';

export interface Ride extends mongoose.Document {
    status: "ongoing" | "payment-pending" | "completed";
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
}

export const rideSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: [ "ongoing", "payment-pending", "completed" ],
    },
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
    userId: mongoose.Types.ObjectId
}, {
    toJSON: {
        transform: (doc: Ride, ret: any) => {
            ret.from = doc.from.coordinates;
            ret.to = doc.to?.coordinates;
        }
    }
});

export const RideModel = mongoose.model<Ride>("ride", rideSchema);