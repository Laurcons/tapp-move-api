import mongoose from 'mongoose';

export interface Ride {
    from: {
        type: "Point",
        coordinates: [number, number]
    },
    to: {
        type: "Point",
        coordinates: [number, number]
    },
    scooterId: string;
    isFinished: boolean;
}

export const rideSchema = new mongoose.Schema({
    from: {
        type: { type: String },
        coordinates: [Number, Number]
    },
    to: {
        type: { type: String },
        coordinates: [Number, Number]
    },
    scooterId: String,
    isFinished: Boolean
});

export const RideModel = mongoose.model("ride", rideSchema);