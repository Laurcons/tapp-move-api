import { getDistance } from "geolib";
import mongoose from "mongoose";
import ApiError from "../api-error";
import { Scooter, ScooterModel } from "../routes/scooter/scooter-model";
import CrudService from "./crud-service-base";
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
		this.tcpService.events.on("scooterStatus", async (data) => {
			const { lockId, batteryLevel, isUnlocked, isCharging } = data;
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
		this.tcpService.events.on("scooterLocation", async (data) => {
			const { lockId, location } = data;
			// don't await
			await this.updateOne(
				{ lockId },
				{ $set: { "location.coordinates": location } }
			);
		});
		this.tcpService.events.on("scooterLockStatus", async (data) => {
			const { isUnlocked, lockId } = data;
			await this.updateOne(
				{ lockId },
				{ $set: { isUnlocked } }
			);
		});
	}

	/** Returns a scooter if the reservation was successful, null otherwise */
	async tryReserveScooter(code: string): Promise<Scooter | null> {
		const scooter = await this.model.findOneAndUpdate({ status: "available", code }, { status: "booking" }, { new: true });
		return scooter;
	}

	async unreserveScooter(code: string) {
		return this.model.updateOne(
			{ status: "booking", code },
			{ status: "available" }
		);
	}

	async unbookScooter(code: string) {
		return this.model.updateOne(
			{ status: "booked", code },
			{ status: "available" }
		);
	}

	async setUnlocked(scooter: Scooter, isUnlocked: boolean) {
		return this.model.updateOne(
			{ _id: scooter._id },
			{ $set: { isUnlocked } }
		);
	}

	async findAll() {
		return await this.model.find({});
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
			status: "available",
		});
	}

	async ping(
		scooterCode: string,
		coordinates: [number, number]
	): Promise<boolean> {
		// retrieve scooter
		const scooter = await this.model.findOne({ status: "available", code: scooterCode });
		if (!scooter) {
			throw ApiError.scooterUnavailable;
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
		if (scooter.isDummy) {
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

	async toggleDisabledStatus(id: string) {
		const scooter = await this.model.findOneAndUpdate(
			{ _id: mongoose.Types.ObjectId(id) },
			[ { $set: { status: { $cond: [ { $eq: ["$status", "disabled"] }, "available", "disabled" ] } } } ],
			{ new: true }
		);
		return scooter;
	}
}
class ScooterServiceInstance extends ScooterService {}
