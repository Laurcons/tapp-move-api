import { Request, Response } from "express";
import RideService from "../../../services/ride-service";
import ScooterService from "../../../services/scooter-service";
import { PaginationQueryDTO, ScooterIdParamsDTO } from "./admin-scooters-dto";
import mongoose from "mongoose";

class AdminScootersController {
    private scooterService = ScooterService.instance;
    private rideService = RideService.instance;

    getAll = async (
        req: Request,
        res: Response
    ) => {
        const scooters = await this.scooterService.findAll();
        res.json({
            status: "success",
            scooters
        });
    }

    getOne = async (
        req: Request<Partial<ScooterIdParamsDTO>>,
        res: Response
    ) => {
        const { id } = req.params as ScooterIdParamsDTO;
        const scooter = await this.scooterService.findId(id);
        res.json({
            status: "success",
            scooter
        });
    }

    toggleDisabled = async (
        req: Request<Partial<ScooterIdParamsDTO>>,
        res: Response
    ) => {
        const { id } = req.params as ScooterIdParamsDTO;
        const scooter = await this.scooterService.toggleDisabledStatus(id);
        res.json({
            status: "success",
            scooter
        });
    }

    getRides = async (
        req: Request<Partial<ScooterIdParamsDTO>, {}, {}, PaginationQueryDTO>,
        res: Response
    ) => {
        const { id } = req.params as ScooterIdParamsDTO;
        const start = parseInt(req.query.start ?? "0");
        const count = parseInt(req.query.count ?? "20");
        const rides = await this.rideService
			.getRidesForScooter(id, start, count)
			.then((rides) =>
				Promise.all(
					rides.map(async (ride) => ({
						...ride,
						route: undefined,
						...(await this.rideService.calculateRideInfo(ride)),
						scooter: await this.scooterService.findOne({
							_id: ride.scooterId,
						}),
					}))
				)
			);
        const total = await this.rideService.find({ scooterId: mongoose.Types.ObjectId(id) }).countDocuments();
        res.json({
            status: "success",
            rides,
            start, count, total
        });
    }

}
export default new AdminScootersController();