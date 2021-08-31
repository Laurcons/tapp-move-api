import { PaginationQueryDTO, PatchBodyDTO, StartRideBodyDTO, StartRideQueryDTO } from "./ride-dto";
import RideService from "../../services/ride-service";
import { Request, Response } from "express";
import { Ride } from "./ride-model";
import { LeanDocument } from "mongoose";
import { ValidationError } from "class-validator";

class RideController {
	rideService = new RideService();

	startRide = async (
		req: Request<{}, {}, StartRideBodyDTO, StartRideQueryDTO>,
		res: Response<{ status: string; ride: Ride }>
	) => {
		// if the isNFC flag is NOT set then we need to check the location
		//  has been provided, because this is not caught by the DTO validation
		if (!req.query.isNFC && !req.body.location) {
			throw new ValidationError();
		}
		const ride = await this.rideService.startRide(
			req.session.user,
			req.body.code,
			req.body.location,
			req.query.isNFC === "true"
		);
		res.json({
			status: "success",
			ride,
		});
	};

	getCurrent = async (
		req: Request<{}, {}, {}, { location: string }>,
		res: Response<{
			status: string;
			linearDistance: number;
			duration: number;
			distanceUnit: string;
			durationUnit: string;
		}>
	) => {
		const { location } = req.query;
		const coords = location.split(",").map(parseFloat) as [number, number];
		const result = await this.rideService.getCurrentRide(
			req.session.user,
			coords
		);
		res.json({
			status: "success",
			...result,
			distanceUnit: "meters",
			durationUnit: "millis",
		});
	};

	endCurrent = async (
		req: Request<{}, {}, {}, { location: string }>,
		res: Response<{
			status: string;
			linearDistance: number;
			price: number;
			duration: number;
			distanceUnit: string;
			durationUnit: string;
			currency: string;
		}>
	) => {
		const { location } = req.query;
		const coords = location.split(",").map(parseFloat) as [number, number];
		const result = await this.rideService.endCurrentRide(
			req.session.user,
			coords
		);
		res.json({
			status: "success",
			...result,
			distanceUnit: "meters",
			durationUnit: "millis",
			currency: "RON",
		});
	};

	patch = async (
		req: Request<{}, {}, PatchBodyDTO>,
		res: Response<{ status: string }>
	) => {
		await this.rideService.updateRide(req.session.user, req.body);
		res.json({
			status: "success",
		});
	};

	getHistory = async (
		req: Request<{}, {}, {}, PaginationQueryDTO>,
		res: Response<{ status: string; start: number; count: number; rides: Ride[] }>
	) => {
		const start = parseInt(req.query.start ?? "0");
		const count = parseInt(req.query.count ?? "20");
		const rides = await this.rideService.getHistory(req.session.user, start, count);
		res.json({
			status: "success",
			start, count,
			rides,
		});
	};
}

export default new RideController();
