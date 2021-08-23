import express from "express";
import ApiError from "../../errors/api-error";
import { Ride } from "../ride/ride-model";
import { Scooter } from "./scooter-model";
import ScooterService from "../../services/scooter-service";

class ScooterController {
	scooterService = new ScooterService();

	findNear = async (
		req: express.Request<{}, {}, {}, { location: string }>,
		res: express.Response<{ status: string; scooters: Scooter[] }>
	) => {
		const parts = req.query.location.split(",");
		const first = parseFloat(parts[0]);
		const last = parseFloat(parts[1]);
		const result = await this.scooterService.findAllNearAndUnbooked([
			first,
			last,
		]);
		res.json({
			status: "success",
			scooters: result,
		});
	};

	getId = async (
		req: express.Request<{ code: string }>,
		res: express.Response<{ status: string; scooter: Scooter }>
	) => {
        const { code } = req.params;
        const scooter = await this.scooterService.findOne({ code });
        if (!scooter)
            throw ApiError.scooterNotFound;
        res.json({
            status: "success",
            scooter
        });
    };

	startRide = async (
		// just to be clear:    PARAMS					BODY							QUERY
		req: express.Request<{ code: string }, {}, { location?: [number, number] }, { isNFC?: string }>,
		res: express.Response<{ status: string; ride: Ride }>
	) => {
		const ride = await this.scooterService.startRide(
			req.session.user,
			req.params.code,
			req.body.location,
			!!req.query.isNFC
		);
		res.json({
			status: "success",
			ride
		});
	}

	ping = async (
		req: express.Request<{ code: string; }, {}, { location: [number, number]}>,
		res: express.Response<{ status: string; successful: boolean; }>
	) => {
		const { code } = req.params;
		const { location } = req.body;
		const successful = await this.scooterService.ping(code, location);
		res.json({
			status: "success",
			successful
		});
	}

	toggleLock = async (
		req: express.Request<{ code: string; }, {}, { lock: boolean; }>,
		res: express.Response<{ status: string; }>
	) => {
		const { code } = req.params;
		const { lock } = req.body;
		await this.scooterService.toggleLock(code, req.session.user, lock);
		res.json({
			status: "success"
		});
	}
}

export default new ScooterController();
