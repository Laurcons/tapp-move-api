import { Scooter, ScooterModel } from "../routes/scooter/scooter-model";
import CrudService from "./crud-service-base";
import mongoose from "mongoose";
import { getDistance } from "geolib";
import ApiError from "../api-error";
import RideService from "./ride-service";
import { User } from "../routes/user/user-model";
import { ScooterTcpService } from "./scooter-tcp-service";

export default abstract class ScooterService extends CrudService<Scooter> {
	private tcpService = ScooterTcpService.instance;

	private static _instance: ScooterService | null = null;
	static get instance() {
		if (!this._instance) this._instance = new ScooterServiceInstance();
		return this._instance;
	}

	constructor() {
		super(ScooterModel);
		this.tcpService.onScooterNeedsUpdate.on(async (data) => {
			const { lockId, batteryLevel, isUnlocked, isCharging } = data;
			// console.log(data);
			// const scoot = await this.findOne({ lockId });
			// console.log(scoot);
			// don't await
			await this.updateOne(
				{ lockId },
				{
					$set: {
						batteryLevel,
						isUnlocked,
						isCharging
					},
				}
			);
		});
		this.tcpService.onScooterNeedsLocationUpdate.on(async (data) => {
			const { lockId, location } = data;
			// don't await
			await this.updateOne(
				{ lockId },
				{ $set: { "location.coordinates": location } }
			);
		});
	}

	/** Returns a scooter if the reservation was successful, null otherwise */
	async tryBookScooter(code: string): Promise<Scooter | null> {
		const scooter = await this.model.findOneAndUpdate({ isBooked: false, code }, { isBooked: true });
		return scooter;
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

	async ping(
		scooterCode: string,
		coordinates: [number, number]
	): Promise<boolean> {
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
		if (scooterCode.startsWith("DMY")) {
			return true;
		} else {
			try {
				const result = await this.tcpService.pingScooter(scooter.lockId);
				return result;
			} catch (_) {
				return false;
			}
		}
	}

	async getAllLockIds() {
		const scooters = await this.model.find({
			code: { $not: { $regex: /^DMY/ } },
		});
		return scooters.map((s) => s.lockId);
	}
}
class ScooterServiceInstance extends ScooterService {}
