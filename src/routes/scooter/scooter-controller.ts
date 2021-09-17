import express from "express";
import ApiError from "../../api-error";
import ScooterService from "../../services/scooter-service";
import {
	FindNearQueryDTO,
	PingBodyDTO,
	ScooterCodeParamsDTO
} from "./scooter-dto";
import { Scooter } from "./scooter-model";

class ScooterController {
	scooterService = ScooterService.instance;

	findNear = async (
		req: express.Request<{}, {}, {}, Partial<FindNearQueryDTO>>,
		res: express.Response<{ status: string; scooters: Scooter[] }>
	) => {
		const parts = (req.query as FindNearQueryDTO).location.split(",");
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
		req: express.Request<Partial<ScooterCodeParamsDTO>>,
		res: express.Response<{ status: string; scooter: Scooter }>
	) => {
		const { code } = req.params as ScooterCodeParamsDTO;
		const scooter = await this.scooterService.findOne({ code });
		if (!scooter) throw ApiError.scooters.scooterNotFound;
		res.json({
			status: "success",
			scooter,
		});
	};

	ping = async (
		req: express.Request<Partial<ScooterCodeParamsDTO>, {}, PingBodyDTO>,
		res: express.Response<{ status: string; successful: boolean }>
	) => {
		const { code } = req.params as ScooterCodeParamsDTO;
		const { location } = req.body;
		const successful = await this.scooterService.ping(code, location);
		res.json({
			status: "success",
			successful,
		});
	};
}

export default new ScooterController();
