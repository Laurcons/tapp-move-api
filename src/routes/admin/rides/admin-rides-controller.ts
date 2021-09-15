import { Request, Response } from "express";
import ApiError from "../../../api-error";
import { IdParamsDTO } from "../../../common-dtos/id-params-dto";
import { PaginationQueryDTO } from "../../../common-dtos/pagination-query-dto";
import RideService from "../../../services/ride-service";
import ScooterService from "../../../services/scooter-service";
import UserService from "../../../services/user-service";

class AdminRidesController {
	private rideService = RideService.instance;
	private userService = UserService.instance;
	private scooterService = ScooterService.instance;

	getAll = async (
		req: Request<{}, {}, {}, PaginationQueryDTO>,
		res: Response
	) => {
		const start = parseInt(req.query.start ?? "0");
		const count = parseInt(req.query.count ?? "20");
		const rides = await Promise.all(
			(
				await this.rideService.getAllSortedAndPaginated(start, count)
			).map(async (r) => ({
				...r,
				...this.rideService.calculateRideInfo(r),
				user: await this.userService.findId(r.userId),
				scooter: await this.scooterService.findId(r.scooterId),
			}))
		);
		const total = await this.rideService.count();
		res.json({
			status: "success",
			start,
			count,
			total,
			rides,
		});
	};

	getOne = async (req: Request<Partial<IdParamsDTO>>, res: Response) => {
		const { id } = req.params as IdParamsDTO;
		const ride = await this.rideService.findId(id);
		if (!ride) throw ApiError.rideNotFound;
		const xride = {
			...ride.toJSON(),
			...this.rideService.calculateRideInfo(ride),
			user: await this.userService.findId(ride.userId),
			scooter: await this.scooterService.findId(ride.scooterId),
		};
		res.json({
			status: "success",
			ride: xride,
		});
	};

	pay = async (
		req: Request<Partial<IdParamsDTO>>,
		res: Response<{ status: string; url: string }>
	) => {
		const { id } = req.params as IdParamsDTO;
		const url = await this.rideService.pay(id);
		res.json({
			status: "success",
			url,
		});
	};
}
export default new AdminRidesController();