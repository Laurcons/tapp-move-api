import RideService from "../../../services/ride-service";
import { Request, Response } from "express";
import { PaginationQueryDTO } from "../users/admin-users-dto";
import UserService from "../../../services/user-service";
import ScooterService from "../../../services/scooter-service";
import { RideIdParamsDTO } from "../../ride/ride-dto";
import ApiError from "../../../api-error";

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
        const rides = 
            await Promise.all(
                (await this.rideService.getAllSortedAndPaginated(start, count))
                .map(async r => ({
                    ...r, 
                    ...this.rideService.calculateRideInfo(r),
                    user: await this.userService.findId(r.userId),
                    scooter: await this.scooterService.findId(r.scooterId),
                }))
            );
        const total = await this.rideService.count();
        res.json({
            status: "success",
            start, count, total,
            rides,
        });
    }

    getOne = async (
        req: Request<Partial<RideIdParamsDTO>>,
        res: Response
    ) => {
        const { id } = req.params as RideIdParamsDTO;
        const ride = await this.rideService.findId(id);
        if (!ride)
            throw ApiError.rideNotFound;
        const xride = {
            ...ride.toJSON(),
            ...this.rideService.calculateRideInfo(ride)
        };
        res.json({
            status: "success",
            ride: xride
        });
    }

}
export default new AdminRidesController();