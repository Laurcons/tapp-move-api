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
}

export default new ScooterController();
