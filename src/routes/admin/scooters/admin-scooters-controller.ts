import { Request, Response } from "express";
import mongoose from "mongoose";
import { IdParamsDTO } from "../../../common-dtos/id-params-dto";
import { PaginationQueryDTO } from "../../../common-dtos/pagination-query-dto";
import RideService from "../../../services/ride-service";
import ScooterService from "../../../services/scooter-service";
import UserService from "../../../services/user-service";
import { AddScooterBodyDTO } from "./admin-scooters-dto";

class AdminScootersController {
    private scooterService = ScooterService.instance;
    private rideService = RideService.instance;
    private userService = UserService.instance;

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
        req: Request<Partial<IdParamsDTO>>,
        res: Response
    ) => {
        const { id } = req.params as IdParamsDTO;
        const scooter = await this.scooterService.findId(id);
        res.json({
            status: "success",
            scooter
        });
    }

    toggleDisabled = async (
        req: Request<Partial<IdParamsDTO>>,
        res: Response
    ) => {
        const { id } = req.params as IdParamsDTO;
        const scooter = await this.scooterService.toggleDisabledStatus(id);
        res.json({
            status: "success",
            scooter
        });
    }

    getRides = async (
        req: Request<Partial<IdParamsDTO>, {}, {}, PaginationQueryDTO>,
        res: Response
    ) => {
        const { id } = req.params as IdParamsDTO;
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
						user: await this.userService.findOne({
							_id: ride.userId,
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

    addNew = async (
        req: Request<{}, {}, AddScooterBodyDTO>,
        res: Response
    ) => {
        const fields = req.body;
        const scooter = await this.scooterService.addNew({
			...fields,
			location: {
				type: "Point",
				coordinates: fields.location,
			},
		});
        res.json({
            status: "success",
            scooter
        });
    }

}
export default new AdminScootersController();