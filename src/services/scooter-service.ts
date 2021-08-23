import { Scooter, ScooterModel } from "../routes/scooter/scooter-model";
import CrudService from "./crud-service";
import mongoose from "mongoose";
import { getDistance } from "geolib";
import ApiError from "../errors/api-error";
import RideService from "./ride-service";
import { User } from "../routes/user/user-model";

export default class ScooterService extends CrudService<Scooter> {
	rideService = new RideService();
	constructor() {
		super(ScooterModel);
	}

	async findAllNearAndUnbooked(coordinates: [number, number]) {
		return await this.model.find({
			location: {
				$nearSphere: {
					$geometry: {
						type: "Point",
						coordinates,
					},
					$maxDistance: 4000,
				},
			},
			isBooked: false,
		});
	}

	async startRide(
		user: User,
		scooterCode: string,
		coordinates?: [number, number],
		isNFC?: boolean
	) {
		if (await this.rideService.isUserRiding(user)) {
			throw ApiError.alreadyRiding;
		}
		// retrieve scooter
		const scooter = await this.model.findOne({ code: scooterCode });
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
		const ride = await this.rideService.insert({
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

	async ping(scooterCode: string, coordinates: [number, number]) {
		// retrieve scooter
		const scooter = await this.model.findOne({ code: scooterCode });
		if (!scooter) {
			throw ApiError.scooterNotFound;
		}
		// check distance
		const dist = getDistance(
			{ lat: coordinates[0], lon: coordinates[1] },
			{
				lat: scooter.location.coordinates[0],
				lon: scooter.location.coordinates[1],
			}
		);
		if (dist > 100) throw ApiError.tooFarAway;
		if (scooterCode.toUpperCase().startsWith("DMY")) {
			return true;
		} else {
			// TODO: add behavior for real scooter
			return true;
		}
	}

	async toggleLock(scooterCode: string, user: User, lock: boolean) {
		// retrieve scooter
		const scooter = await this.model.findOne({ code: scooterCode });
		if (!scooter)
			throw ApiError.scooterNotFound;
		// find ride with user
		const ride = await this.rideService.findOne({ userId: user._id, isFinished: false, scooterId: scooter._id });
		if (!ride)
			throw ApiError.actionNotAllowed;
		// update scooter n set locked
		await this.model.updateOne(
			{ code: scooterCode },
			{ $set: { isUnlocked: !lock } }
		);
	}
}
