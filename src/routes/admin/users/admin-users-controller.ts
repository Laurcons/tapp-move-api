import UserService from "../../../services/user-service";
import { Request, Response } from "express";
import RideService from "../../../services/ride-service";
import AwsService from "../../../services/aws-service";
import { SuspendUserBodyDTO } from "./admin-users-dto";
import ApiError from "../../../api-error";
import ScooterService from "../../../services/scooter-service";
import { IdParamsDTO } from "../../../common-dtos/id-params-dto";
import { PaginationQueryDTO } from "../../../common-dtos/pagination-query-dto";

class AdminUserController {
	private userService = UserService.instance;
	private rideService = RideService.instance;
	private awsService = AwsService.instance;
	private scooterService = ScooterService.instance;

	getAll = async (req: Request, res: Response) => {
		const usersPlain = await this.userService.find({});
		const users = await Promise.all(
			usersPlain.map(async (user) => {
				const rides = await this.rideService.getRidesForUser(user._id, 0, 1000000);
				// const driversLicense =
				//     user.driversLicenseKey ?
				//     await this.awsService.getSignedUrl(user.driversLicenseKey) :
				//     undefined;
				return {
					...user.toObject(),
					currentRides: rides.filter((r) => r.status === "ongoing")
						.length,
					// driversLicense
				};
			})
		);
		res.json({
			status: "success",
			users,
		});
	};

	getOne = async (req: Request<Partial<IdParamsDTO>>, res: Response) => {
		const { id } = req.params as IdParamsDTO;
		const user = await this.userService.findId(id);
		if (!user) throw ApiError.userNotFound;
		const driversLicense = user.driversLicenseKey
			? await this.awsService.getSignedUrl(user.driversLicenseKey)
			: undefined;
		res.json({
			status: "success",
			user: {
				...user.toObject(),
				driversLicense,
			},
		});
	};

	getRidesForUser = async (
		req: Request<Partial<IdParamsDTO>, {}, {}, PaginationQueryDTO>,
		res: Response
	) => {
		const { id } = req.params as IdParamsDTO;
		const start = parseInt(req.query.start ?? "0");
		const count = parseInt(req.query.count ?? "5");
		const user = await this.userService.findId(id);
		if (!user) throw ApiError.userNotFound;
		const rides = await this.rideService
			.getRidesForUser(user._id, start, count)
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
		const total = await this.rideService
			.find({ userId: user._id })
			.countDocuments();
		res.json({
			status: "success",
			start,
			count,
			total,
			rides,
		});
	};

	suspend = async (req: Request<Partial<IdParamsDTO>, {}, SuspendUserBodyDTO>, res: Response) => {
		const { reason } = req.body;
		const { id } = req.params as IdParamsDTO;
		const user = await this.userService.suspendUser(id, reason);
		res.json({
			status: "success",
			user
		});
	};
}
export default new AdminUserController();
