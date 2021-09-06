import { ScooterModel } from './../scooter/scooter-model';
import mongoose from 'mongoose';

export interface Ride extends mongoose.Document {
    status: "ongoing" | "payment-pending" | "completed";
	route: [[number, number]];
    startLocation: {
        type: "Point",
        coordinates: [number, number]
    },
    endLocation: {
        type: "Point",
        coordinates: [number, number]
    },
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