import RideService from "../../services/ride-service";
import { Request, Response } from "express";
import { Ride } from "./ride-model";
import { LeanDocument } from "mongoose";

class RideController {
	rideService = new RideService();

	startRide = async (
		// just to be clear  PARAMS                    BODY                      QUERY
		req: Request<
			{ code: string },
			{},
			{ location?: [number, number] },
			{ isNFC?: string }
		>,
		res: Response<{ status: string; ride: Ride }>
	) => {
		const ride = await this.rideService.startRide(
			req.session.user,
			req.params.code,
			req.body.location,
			!!req.query.isNFC
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

	toggleLock = async (
		req: Request<{}, {}, { lock: boolean }>,
		res: Response<{ status: string }>
	) => {
		const { lock } = req.body;
		await this.rideService.toggleLock(req.session.user, lock);
		res.json({
			status: "success",
		});
	};

	getHistory = async (
		req: Request,
		res: Response<{ status: string; rides: LeanDocument<Ride>[]}>
	) => {
		const rides = await this.rideService.getHistory(req.session.user);
		res.json({
			status: "success",
			rides
		});
	}
}

export default new RideController();
