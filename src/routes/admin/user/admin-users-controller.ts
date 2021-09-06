import UserService from "../../../services/user-service";
import { Request, Response } from "express";
import RideService from "../../../services/ride-service";
import AwsService from "../../../services/aws-service";
import { UserIdParamsDTO } from "./admin-users-dto";
import ApiError from "../../../api-error";

class AdminUserController {
	private userService = UserService.instance;
    private rideService = RideService.instance;
    private awsService = AwsService.instance;

	getAll = async (req: Request, res: Response) => {
        const usersPlain = await this.userService.find({});
        const users = await Promise.all(usersPlain.map(async user => {
            const rides = await this.rideService.getRidesForUser(user);
            // const driversLicense = 
            //     user.driversLicenseKey ?
            //     await this.awsService.getSignedUrl(user.driversLicenseKey) :
            //     undefined;
            return {
                ...user.toObject(),
                currentRides: rides.filter(r => r.status === "ongoing").length,
                // driversLicense
            };
        }));
        res.json({
            status: "success",
            users
        });
    };

    getOne = async (req: Request<Partial<UserIdParamsDTO>>, res: Response) => {
        const { id } = req.params as UserIdParamsDTO;
		const user = await this.userService.findId(id);
        if (!user)
            throw ApiError.userNotFound;
		const driversLicense =
		    user.driversLicenseKey ?
		    await this.awsService.getSignedUrl(user.driversLicenseKey) :
		    undefined;
        res.json({
            status: "success",
            user: {
                ...user.toObject(),
                driversLicense
            }
        });
	};
}
export default new AdminUserController();
