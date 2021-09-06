import UserService from "../../../services/user-service";
import { Request, Response } from "express";
import RideService from "../../../services/ride-service";
import AwsService from "../../../services/aws-service";

class AdminUserController {
	private userService = UserService.instance;
    private rideService = RideService.instance;
    private awsService = AwsService.instance;

	getAll = async (req: Request, res: Response) => {
        const usersPlain = await this.userService.find({});
        const users = await Promise.all(usersPlain.map(async user => {
            const rides = await this.rideService.getRidesForUser(user);
            const driversLicense = 
                user.driversLicenseKey ?
                await this.awsService.getSignedUrl(user.driversLicenseKey) :
                undefined;
            return {
                ...user.toObject(),
                currentRides: rides.filter(r => r.status === "ongoing").length,
                driversLicense
            };
        }));
        res.json({
            status: "success",
            users
        });
    };
}
export default new AdminUserController();
