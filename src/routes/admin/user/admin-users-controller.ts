import UserService from "../../../services/user-service";
import { Request, Response } from "express";
import RideService from "../../../services/ride-service";

class AdminUserController {
	private userService = UserService.instance;
    private rideService = RideService.instance;

	getAll = async (req: Request, res: Response) => {
        const usersPlain = await this.userService.find({});
        const users = await Promise.all(usersPlain.map(async user => {
            const rides = await this.rideService.getRidesForUser(user);
            return {
                ...user.toObject(),
                currentRides: rides.filter(r => r.status === "ongoing").length
            };
        }));
        res.json({
            status: "success",
            users
        });
    };
}
export default new AdminUserController();
