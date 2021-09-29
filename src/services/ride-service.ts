import axios from "axios";
import { getDistance } from "geolib";
import { DateTime } from "luxon";
import mongoose from "mongoose";
import ApiError from "../api-error";
import Config from "../environment";
import { PatchBodyDTO } from "../routes/ride/ride-dto";
import { Ride, RideModel, RideStatus } from "../routes/ride/ride-model";
import { User } from "../routes/user/user-model";
import { Logger } from "./../logger";
import CrudService from "./crud-service-base";
import PaymentsService from "./payments-service";
import ScooterService from "./scooter-service";
import { ScooterLocationEvent, ScooterTcpService } from "./scooter-tcp-service";
import UserService from "./user-service";

export default abstract class RideService extends CrudService<Ride> {
	private scooterService = ScooterService.instance;
	private userService = UserService.instance;
	private tcpService = ScooterTcpService.instance;
	private paymentsService = PaymentsService.instance;
	private _logger = new Logger({ prefix: "ride-svc" });

	private static _instance: RideService | null = null;
	static get instance() {
		if (!this._instance) this._instance = new RideServiceInstance();
		return this._instance;
	}

	constructor() {
		super(RideModel);
		this.tcpService.events.on("scooterLocation", (data) => this.handleNewRoutePoint(data));
	}

	private async handleNewRoutePoint(data: ScooterLocationEvent) {
		const { lockId, location } = data;
		const scooter = await this.scooterService.findOne({ lockId });
		if (!scooter) {
			this._logger.log("Couldn't find lockId in database in scooterLocation handler".red);
			throw "what";
		}
		const ride = await this.model.findOne({
			scooterId: scooter._id,
			status: "ongoing",
		});
		if (!ride && data.isFromTracking) {
			// we tell the scooter to stop sending at interval
			// await this.tcpService.endTrackPosition(lockId);
		}
		if (!ride) {
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
		await this.pushRouteLocation(ride, location);
		this._logger.log(`Added location with d=${distance} for code=${scooter.code}`);
	}

	pushRouteLocation(ride: Ride, location: [number, number]) {
		return this.model.updateOne(
			{ _id: ride._id },
			{
				$set: { distance: this.calculateRideInfo(ride).distance },
				$push: { route: location },
			}
		);
	}

	private async userHasUnpaidRides(user: User) {
		const count = await this.model.countDocuments({
			userId: user._id,
			$or: [
				{ status: { $eq: "payment-pending" } },
				{ status: { $eq: "payment-initiated" } },
			]
		});
		return count !== 0;
	}

	calculateRideInfo(ride: Ride) {
		let distance = 0;
		for (let i = 0; i < ride.route.length - 1; i++) {
			distance += getDistance(ride.route[i], ride.route[i + 1]);
		}
		const duration =
			-1 * (ride.endedAt ? DateTime.fromJSDate(ride.startedAt).diff(DateTime.fromJSDate(ride.endedAt)).as("milliseconds") : DateTime.fromJSDate(ride.startedAt).diffNow().as("milliseconds"));
		const price = 200 + Math.floor(80 * (duration / 1000 / 60)); // 0.80 lei per minute + 2 lei flatrate
		return {
			// linearDistance,
			distance,
			duration,
			price,
		};
	}

	async getRide(rideId: string, user: User) {
		const ride = await this.model.findOne({
			_id: mongoose.Types.ObjectId(rideId),
			userId: user._id,
		});
		if (!ride) throw ApiError.rides.rideNotFound;
		const details = this.calculateRideInfo(ride);
		const newRide = await this.model.findOneAndUpdate({ _id: ride._id }, { $set: details }, { new: true });
		return newRide as Ride;
	}

	async startRide(user: User, scooterCode: string, coordinates?: [number, number], isNFC?: boolean) {
		// check if user has unpaid rides
		if (await this.userHasUnpaidRides(user)) {
			throw ApiError.rides.userHasUnpaidRides;
		}
		// retrieve scooter
		const scooter = await this.scooterService.tryReserveScooter(scooterCode);
		if (!scooter) {
			throw ApiError.scooters.scooterUnavailable;
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
				if (dist > 80) throw ApiError.scooters.tooFarAway;
			}
			// unlock the actual scooter
			if (!scooter.isDummy) {
				if (!scooter.isUnlocked) await this.tcpService.unlockScooter(scooter.lockId);
				await this.tcpService.beginTrackPosition(scooter.lockId);
			} else {
				// set unlocked on dummy
				await this.scooterService.updateOne({ _id: scooter._id }, { isUnlocked: true });
			}
			const startAddress = await (async () => {
				const result = await axios.get(
					`https://maps.googleapis.com/maps/api/geocode/json?latlng=${scooter.location.coordinates[0]},${scooter.location.coordinates[1]}&key=${Config.get("MAPS_API_KEY")}`
				);
				console.log(result.data);
				const components = result.data.results[0].address_components as any[];
				return components[1].long_name + " " + components[0].long_name;
			})();
			// create ride
			const ride = await this.insert({
				route: [scooter.location.coordinates],
				startLocation: {
					type: "Point",
					coordinates: scooter.location.coordinates,
				},
				startAddress,
				status: "ongoing",
				price: 0,
				distance: 0,
				duration: 0,
				scooterId: scooter._id,
				userId: user._id,
			});
			// increment ride counter on user
			await this.userService.incrementRideCount(user);
			// set booked status on scooter
			await this.scooterService.updateOne({ _id: scooter._id }, { status: "booked" });
			return ride;
		} catch (ex) {
			this.scooterService.unreserveScooter(scooterCode);
			console.log(ex);
			if (ex instanceof ApiError) throw ex;
			throw ApiError.scooters.scooterUnavailable;
		}
	}

	async endRide(rideId: string, currentCoords: [number, number]) {
		const ride = await this.model.findOne({
			_id: mongoose.Types.ObjectId(rideId),
			status: "ongoing",
		});
		if (!ride) throw ApiError.rides.rideNotFound;
		const details = this.calculateRideInfo(ride);
		const scooter = await this.scooterService.findOne({
			_id: ride.scooterId,
		});
		if (!scooter) throw ApiError.scooters.scooterNotFound;
		// end physically
		if (!scooter.isDummy) {
			try {
				await this.tcpService.endTrackPosition(scooter.lockId);
				if (scooter.isUnlocked) await this.tcpService.lockScooter(scooter.lockId);
			} catch (_) {
				this._logger.log("Scooter did not respond while ending ride".red);
			}
		} else {
			await this.scooterService.setUnlocked(scooter, true);
		}
		const endAddress = await (async () => {
			const result = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${currentCoords[0]},${currentCoords[1]}&key=${Config.get("MAPS_API_KEY")}`);
			console.log(result.data);
			const components = result.data.results[0].address_components as any[];
			return components[1].long_name + " " + components[0].long_name;
		})();
		// end in db
		const newRide = await this.model.findOneAndUpdate(
			{ _id: ride._id },
			{
				$set: {
					endLocation: {
						type: "Point",
						coordinates: currentCoords,
					},
					endAddress,
					status: "payment-pending",
					endedAt: new Date(),
					...details,
				},
				$push: {
					route: currentCoords,
				},
			},
			{ new: true }
		);
		await this.scooterService.unbookScooter(scooter.code);
		return newRide as Ride;
	}

	async updateRide(rideId: string, settings: PatchBodyDTO) {
		const ride = await this.findOne({
			_id: mongoose.Types.ObjectId(rideId),
			status: "ongoing",
		});
		if (!ride) throw ApiError.rides.rideNotFound;
		// retrieve scooter
		const scooter = await this.scooterService.findOne({
			_id: ride.scooterId,
		});
		if (!scooter) throw ApiError.scooters.scooterNotFound;
		const { lock } = settings;
		// set on actual scooter
		if (!scooter.isDummy) {
			const { headlights, taillights } = settings;
			if (lock !== undefined) {
				if (lock) await this.tcpService.lockScooter(scooter.lockId);
				else await this.tcpService.unlockScooter(scooter.lockId);
			}
			if (headlights !== undefined || taillights !== undefined) {
				await this.tcpService.modifyLights(scooter.lockId, {
					head: headlights,
					tail: taillights,
				});
			}
		} else {
			// update scooter n set locked
			if (lock !== undefined) {
				await this.scooterService.setUnlocked(scooter._id, !lock);
			}
		}
	}

	async getRidesForUser(userId: string, start: number, count: number, status?: RideStatus) {
		let cond: Record<string, any> = {
			userId: mongoose.Types.ObjectId(userId),
		};
		if (status) cond.status = status;
		return this.getSortedAndPaginatedRides({ $match: cond }, start, count);
	}

	private async getSortedAndPaginatedRides(match: any, start: number, count: number) {
		const order = ["ongoing", "payment-initiated", "payment-pending", "completed"];
		const buildSortingSwitch = () => ({
			$switch: {
				branches: order.map((o, i) => ({
					case: { $eq: ["$status", o] },
					then: i,
				})),
				default: order.length,
			},
		});
		return this.model.aggregate([
			match,
			{
				$addFields: {
					statusInt: buildSortingSwitch(),
				},
			},
			{ $sort: { statusInt: 1, startedAt: -1 } },
			{ $project: { statusInt: 0 } },
			// stackoverflow did it like this
			{ $limit: start + count },
			{ $skip: start },
		]);
	}

	async getRidesForScooter(scooterId: string, start: number, count: number) {
		return this.getSortedAndPaginatedRides({ $match: { scooterId: mongoose.Types.ObjectId(scooterId) } }, start, count);
	}

	async getAllSortedAndPaginated(start: number, count: number) {
		return this.getSortedAndPaginatedRides({ $match: {} }, start, count);
	}

	async beginPayment(rideId: string) {
		const ride = await this.model.findOneAndUpdate(
			{
				_id: rideId,
				status: /(payment-pending)|(payment-initiated)/,
			},
			{
				status: "payment-initiated",
			}
		);
		if (!ride) throw ApiError.rides.rideNotFound;
		const session = await this.paymentsService.createCheckoutForRide(ride);
		await this.model.updateOne({ _id: rideId }, { $set: { checkoutId: session.id } });
		return session.url as string;
	}

	async endPayment(rideId: string) {
		await this.model.updateOne(
			{
				_id: rideId,
			},
			{
				$set: { status: "completed" },
				$unset: { checkoutId: 1 },
			}
		);
	}

	async cancelPayment(rideId: string) {
		await this.model.updateOne(
			{
				_id: rideId,
			},
			{
				$set: { status: "payment-pending" },
				$unset: { checkoutId: 1 },
			}
		);
	}

	async getCalculatedRide(rideId: string | mongoose.Types.ObjectId) {
		if (typeof rideId === "string") {
			rideId = mongoose.Types.ObjectId(rideId);
		}
		const origRide = await this.model.findOne({ _id: rideId });
		if (!origRide) throw ApiError.rides.rideNotFound;
		return this.model.findOneAndUpdate({ _id: rideId }, { $set: this.calculateRideInfo(origRide) });
	}

	async createPaymentIntent(rideId: string) {
		const ride = await this.findId(rideId);
		if (!ride) throw ApiError.rides.rideNotFound;
		const info = await this.paymentsService.createPaymentIntentForRide(ride);
		return info;
	}
}
class RideServiceInstance extends RideService {}
