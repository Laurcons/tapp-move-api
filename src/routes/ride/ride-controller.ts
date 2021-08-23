import RideService from "../../services/ride-service";
import { Request, Response } from "express";

class RideController {
	rideService = new RideService();

	getCurrent = async (
		req: Request<{}, {}, {}, { location: string }>,
		res: Response<{
			status: string;
			linearDistance: number;
			duration: number;
            distanceUnit: string;
            durationUnit: string;
		}>
	) => {
		const { location } = req.query;
		const coords = location.split(",").map(parseFloat) as [number, number];
		const result = await this.rideService.getCurrentRide(req.session.user, coords);
        res.json({
            status: "success",
            ...result,
            distanceUnit: "meters",
            durationUnit: "millis"
        });
	};
}

export default new RideController();
