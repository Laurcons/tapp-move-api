import { getDistance } from "geolib";
import { DateTime } from "luxon";
import ApiError from "../errors/api-error";
import { Ride, RideModel } from "../routes/ride/ride-model";
import { User } from "../routes/user/user-model";
import CrudService from "./crud-service";
import ScooterService from "./scooter-service";

export default class RideService extends CrudService<Ride> {
	private scooterService = new ScooterService();

	constructor() {
		super(RideModel);
	}

	private calculateRideInfo(ride: Ride, currentLocation: [number, number]) {
		const linearDistance = getDistance(currentLocation, {
			lat: ride.from.coordinates[1],
			lon: ride.from.coordinates[0],
		});
		const duration =
			-1 *
			DateTime.fromJSDate(ride.startedAt).diffNow().as("milliseconds");
		const price = Math.floor(80 * (duration / 1000 / 60)); // 0.80 lei per minute
		return {
			linearDistance,
			duration,
			price,
		};
	}

	async isUserRiding(user: User): Promise<boolean> {
		const result = await this.model.findOne({
			userId: user._id,
			isFinished: false,
		});
		return !!result;
	}

	async getCurrentRide(user: User, currentLocation: [number, number]) {
		const ride = await this.model.findOne({
			userId: user._id,
			isFinished: false,
		});
		if (!ride) throw ApiError.rideNotFound;
		const details = this.calculateRideInfo(ride, currentLocation);
		return {
			ride,
			...details,
		};
	}

	async startRide(
		user: User,
		scooterCode: string,
		coordinates?: [number, number],
		isNFC?: boolean
	) {
		if (await this.isUserRiding(user)) {
			throw ApiError.alreadyRiding;
		}
		// retrieve scooter
		const scooter = await this.scooterService.findOne({
			code: scooterCode,
		});
		if (!scooter) {
			throw ApiError.scooterNotFound;
		}
		if (scooter.isBooked) {
			throw ApiError.scooterUnavailable;
		}
		// check if scooter is within 80 meters
		if (!isNFC) {
			// this will be caught by the validation but we need to check here
			// bc of ts
			if (!coordinates) throw new Error("what happend");
			const dist = getDistance(
				{ lat: coordinates[0], lon: coordinates[1] },
				{
					lat: scooter.location.coordinates[0],
					lon: scooter.location.coordinates[1],
				}
			);
			if (dist > 80) throw ApiError.tooFarAway;
		}
		// mark scooter as booked
		scooter.isBooked = true;
		scooter.isUnlocked = true;
		await scooter.save();
		// create ride
		const ride = await this.insert({
			from: {
				type: "Point",
				coordinates: scooter.location.coordinates,
			},
			isFinished: false,
			scooterId: scooter._id,
			userId: user._id,
		});
		return ride;
	}

	async endCurrentRide(user: User, currentLocation: [number, number]) {
		const ride = await this.model.findOne({
			userId: user._id,
			isFinished: false,
		});
		if (!ride) throw ApiError.rideNotFound;
		const details = this.calculateRideInfo(ride, currentLocation);
		// end
		const newRide = await this.model.findOneAndUpdate(
			{ _id: ride._id },
			{
				$set: {
					to: {
						type: "Point",
						coordinates: currentLocation,
					},
					isFinished: true,
					endedAt: new Date(),
				},
			},
			{ new: true, useFindAndModify: true }
		);
		await this.scooterService.updateOne(
			{ _id: ride.scooterId },
			{ $set: { isBooked: false, isUnlocked: true } }
		);
		return {
			ride: newRide,
			...details,
		};
	}

	async toggleLock(user: User, lock: boolean) {
		const ride = await this.findOne({
			userId: user._id,
			isFinished: false,
		});
		if (!ride) throw ApiError.rideNotFound;
		// retrieve scooter
		const scooter = await this.scooterService.findOne({
			_id: ride.scooterId,
		});
		if (!scooter) throw ApiError.scooterNotFound;
		// find ride with user
		// update scooter n set locked
		await this.scooterService.updateOne(
			{ _id: scooter._id },
			{ $set: { isUnlocked: !lock } }
		);
	}

	async getHistory(user: User, start: number, count: number) {
		const rides = await this.model
			.find({ userId: user._id, isFinished: true })
			.skip(start)
			.limit(count);
		return rides;
	}
}
