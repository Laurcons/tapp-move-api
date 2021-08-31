import { Scooter, ScooterModel } from "../routes/scooter/scooter-model";
import CrudService from "./crud-service";
import mongoose from "mongoose";
import { getDistance } from "geolib";
import ApiError from "../errors/api-error";
import RideService from "./ride-service";
import { User } from "../routes/user/user-model";
import { ScooterTcpService } from "./scooter-tcp-service";

export default class ScooterService extends CrudService<Scooter> {
	private tcpService = ScooterTcpService.instance;

	constructor() {
		super(ScooterModel);
		this.tcpService.onScooterNeedsUpdate.on(data => {
			const { lockId, batteryLevel, isUnlocked } = data;
			// don't await
			this.updateOne(
				{ lockId: lockId },
				{ $set: {
					batteryLevel, isUnlocked
				}}
			);
		});
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

	async ping(scooterCode: string, coordinates: [number, number]): Promise<boolean> {
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
			const result = await this.tcpService.pingScooter(scooter.lockId);
			return result;
		}
	}

	async getAllLockIds() {
		const scooters = await this.model.find({ code: { $not: { $regex: /^DMY/ } } });
		return scooters.map(s => s.lockId);
	}
}
