import { getDistance } from "geolib";
import { DateTime } from "luxon";
import ApiError from "../errors/api-error";
import { Ride, RideModel } from "../routes/ride/ride-model";
import { User } from "../routes/user/user-model";
import CrudService from "./crud-service";

export default class RideService extends CrudService<Ride> {
    constructor() {
        super(RideModel);
    }

    async isUserRiding(user: User): Promise<boolean> {
        const result = await this.model.findOne(
            { userId: user._id }
        );
        return !!result;
    }

    async getCurrentRide(user: User, currentLocation: [number, number]) {
        const ride = await this.model.findOne(
            { userId: user._id }
        );
        if (!ride) 
            throw ApiError.rideNotFound;
        const linearDistance = getDistance(
            currentLocation,
            {
                lat: ride.from.coordinates[1],
                lon: ride.from.coordinates[0]
            }
        );
        const duration = -1 * DateTime.fromJSDate(ride.startedAt).diffNow().as("milliseconds");
        return {
            linearDistance, duration
        };
    }
}