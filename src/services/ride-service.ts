import mongoose from 'mongoose';
import { Logger } from './../logger';
import { getDistance } from "geolib";
import { DateTime } from "luxon";
import ApiError from "../api-error";
import { PatchBodyDTO } from "../routes/ride/ride-dto";
import { Ride, RideModel } from "../routes/ride/ride-model";
import { User } from "../routes/user/user-model";
import CrudService from "./crud-service-base";
import ScooterService from "./scooter-service";
import { ScooterTcpService } from "./scooter-tcp-service";

export default abstract class RideService extends CrudService<Ride> {
	private scooterService = ScooterService.instance;
	private tcpService = ScooterTcpService.instance;
	private _logger = new Logger({ prefix: "ride-svc"});

	private static _instance: RideService | null = null;
	static get instance() {
		if (!this._instance) this._instance = new RideServiceInstance();
		return this._instance;
	}

	constructor() {
		super(RideModel);
		this.tcpService.onScooterNeedsLocationUpdate.on(async (data) => {
			const { lockId, location } = data;
			const scooter = await this.scooterService.findOne({ lockId });
			if (!scooter) {
				this._logger.log("Couldn't find lockId in database in onNewRoutePoint handler".red);
				throw "what";
			}
			// the ride object has optimisticConcurrency set to true, so it will not be available for
			//  modification until save() is called
			const ride = await this.model.findOne({ scooterId: scooter._id, status: "ongoing" });
			if (!ride) {
				// this means that there isn't any active ride with this scooter:
				//  we preventively tell it to stop sending at interval (in case it is sending at interval)
				await this.tcpService.endTrackPosition(lockId);
				return;
			}
			const lastPoint = ride.route[ride.route.length - 1];
			if (!lastPoint) throw "what";
			const distance = getDistance(lastPoint, location);
			// if distance is less than 10 meters, don't add
			if (distance < 10) {
				this._logger.log(`Distance since last point was ${distance} <10m so it was ignored`);
				return;
			}
			// add it
			ride.route.push(location);
			await ride.save();
			this._logger.log(`Added location with d=${distance} for code=${scooter.code}`);
		});
	}

	private calculateRideInfo(ride: Ride, currentLocation?: [number, number]) {
		const linearDistance = getDistance(ride.route[ride.route.length-1], {
			lat: ride.route[0][1],
			lon: ride.route[0][0],
		});
		let pathDistance = 0;
		for (let i = 0; i < ride.route.length - 1; i++) {
			pathDistance += getDistance(ride.route[i], ride.route[i+1]);
		}
		const duration =
			-1 *
			DateTime.fromJSDate(ride.startedAt).diffNow().as("milliseconds");
		const price = Math.floor(80 * (duration / 1000 / 60)); // 0.80 lei per minute
		return {
			linearDistance,
			pathDistance,
			duration,
			price,
		};
	}

	async isUserRiding(user: User): Promise<boolean> {
		const result = await this.model.findOne({
			userId: user._id,
			status: "ongoing"
		});
		return !!result;
	}

	async getRide(rideId: string, currentLocation: [number, number]) {
		const ride = await this.model.findOne({
			_id: mongoose.Types.ObjectId(rideId),
			status: "ongoing"
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
		// if (await this.isUserRiding(user)) {
		// 	throw ApiError.alreadyRiding;
		// }
		// retrieve scooter
		const scooter = await this.scooterService.tryBookScooter(scooterCode);
		if (!scooter) {
			throw ApiError.scooterUnavailable;
		}
		// in case any of the following fails, the scooter needs be unreserved
		try {
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
			// unlock the actual scooter
			if (!scooter.code.startsWith("DMY")) {
				if (!scooter.isUnlocked)
					await this.tcpService.unlockScooter(scooter.lockId);
				await this.tcpService.beginTrackPosition(scooter.lockId);
			}
			// mark scooter as booked
			scooter.isUnlocked = true;
			await scooter.save();
			// create ride
			const ride = await this.insert({
				route: [ scooter.location.coordinates ],
				status: "ongoing",
				scooterId: scooter._id,
				userId: user._id,
			});
			// increment ride counter on user
			user.totalRides++;
			await user.save();
			return ride;
		} catch (ex) {
			scooter.isBooked = false;
			await scooter.save();
			console.log(ex);
			if (ex instanceof ApiError)
				throw ex;
			throw ApiError.scooterUnavailable;
		}
	}

	async endRide(rideId: string, currentLocation: [number, number]) {
		const ride = await this.model.findOne({
			_id: mongoose.Types.ObjectId(rideId),
			status: "ongoing"
		});
		if (!ride) throw ApiError.rideNotFound;
		const details = this.calculateRideInfo(ride, currentLocation);
		const scooter = await this.scooterService.findOne({
			_id: ride.scooterId,
		});
		if (!scooter) throw ApiError.scooterNotFound;
		// end physically
		if (!scooter.code.startsWith("DMY")) {
			try {
				await this.tcpService.endTrackPosition(scooter.lockId);
				if (scooter.isUnlocked)
					await this.tcpService.lockScooter(scooter.lockId);
			} catch (_) {
				this._logger.log("Scooter did not respond while ending ride".red);
			}
		}
		// end in db
		const newRide = await this.model.findOneAndUpdate(
			{ _id: ride._id },
			{
				$set: {
					to: {
						type: "Point",
						coordinates: currentLocation,
					},
					status: "completed",
					endedAt: new Date(),
				},
			},
			{ new: true, useFindAndModify: false }
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

	async updateRide(rideId: string, settings: PatchBodyDTO) {
		const ride = await this.findOne({
			_id: mongoose.Types.ObjectId(rideId),
			status: "ongoing"
		});
		if (!ride) throw ApiError.rideNotFound;
		// retrieve scooter
		const scooter = await this.scooterService.findOne({
			_id: ride.scooterId,
		});
		if (!scooter) throw ApiError.scooterNotFound;
		const { lock } = settings;
		// set on actual scooter
		if (!scooter.code.startsWith("DMY")) {
			const { headlights, taillights } = settings;
			if (lock !== undefined) {
				if (lock) await this.tcpService.lockScooter(scooter.lockId);
				else await this.tcpService.unlockScooter(scooter.lockId);
			}
			await this.tcpService.modifyLights(scooter.lockId, {
				head: headlights,
				tail: taillights,
			});
		}
		// update scooter n set locked
		if (lock !== undefined) {
			await this.scooterService.updateOne(
				{ _id: scooter._id },
				{ $set: { isUnlocked: !lock } }
			);
		}
	}

	async getHistory(user: User, start: number, count: number) {
		const rides = await this.model
			.find({ userId: user._id })
			.skip(start)
			.limit(count);
		return rides;
	}

	async getRidesForUser(user: User) {
		return await this.model.find({ userId: user._id });
	}
}
class RideServiceInstance extends RideService {}