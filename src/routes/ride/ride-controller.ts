import { Request, Response } from "express";
import ApiError from "../../api-error";
import { IdParamsDTO } from "../../common-dtos/id-params-dto";
import { PaginationQueryDTO } from "../../common-dtos/pagination-query-dto";
import PaymentsService from "../../services/payments-service";
import RideService from "../../services/ride-service";
import { GetRidesQueryDTO, LocationQueryDTO, PatchBodyDTO, StartRideBodyDTO, StartRideQueryDTO } from "./ride-dto";
import { Ride } from "./ride-model";

class RideController {
	private rideService = RideService.instance;

	startRide = async (
		req: Request<{}, {}, StartRideBodyDTO, StartRideQueryDTO>,
		res: Response<{ status: string; ride: Ride }>
	) => {
		// if the isNFC flag is NOT set then we need to check the location
		//  has been provided, because this is not caught by the DTO validation
		if (!req.query.isNFC && !req.body.location) {
			throw new ApiError(400, "location-not-set", "You need to provide the location if you're not using NFC");
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

	getRide = async (
		req: Request<Partial<IdParamsDTO>, {}, {}, Partial<LocationQueryDTO>>,
		res: Response<{
			status: string;
			linearDistance: number;
			duration: number;
			distanceUnit: string;
			durationUnit: string;
		}>
	) => {
		const { location } = req.query as LocationQueryDTO;
		const { id } = req.params as IdParamsDTO;
		const coords = location.split(",").map(parseFloat) as [number, number];
		const result = await this.rideService.getRide(id, coords);
		res.json({
			status: "success",
			...result,
			distanceUnit: "meters",
			durationUnit: "millis",
		});
	};

	endRide = async (
		req: Request<Partial<IdParamsDTO>, {}, {}, Partial<LocationQueryDTO>>,
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
		const { location } = req.query as LocationQueryDTO;
		const { id } = req.params as IdParamsDTO;
		const coords = location.split(",").map(parseFloat) as [number, number];
		const result = await this.rideService.endRide(id, coords);
		res.json({
			status: "success",
			...result,
			distanceUnit: "meters",
			durationUnit: "millis",
			currency: "RON",
		});
	};

	patch = async (
		req: Request<Partial<IdParamsDTO>, {}, PatchBodyDTO>,
		res: Response<{ status: string }>
	) => {
		await this.rideService.updateRide((req.params as IdParamsDTO).id, req.body);
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

	pay = async (
		req: Request<Partial<IdParamsDTO>>,
		res: Response<{ status: string; url: string; }>
	) => {
		const { id } = req.params as IdParamsDTO;
		const url = await this.rideService.pay(id);
		res.json({
			status: "success",
			url,
		});
	}

	getRides = async (
		req: Request<{}, {}, {}, GetRidesQueryDTO>,
		res: Response
	) => {
		const { status } = req.query;
		const rides = await this.rideService.getRidesForUser(req.session.user._id, 0, 100000, status);
		res.json({
			status: "success",
			rides
		});
	}
}

export default new RideController();
