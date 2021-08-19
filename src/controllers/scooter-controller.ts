import express from "express";
import BodyApiError from "../errors/body-api-error";
import ScooterService from "../services/scooter-service";

class ScooterController {
	scooterService = new ScooterService();

	findNear = async (req: express.Request, res: express.Response) => {
		if (typeof req.query.location !== "string")
			throw new BodyApiError("query.location", "not-present");
        const parts = req.query.location.split(',');
        if (parts.length !== 2)
            throw new BodyApiError("query.location", "invalid");
        const first = parseFloat(parts[0]);
        const last = parseFloat(parts[1]);
		const result = await this.scooterService.findAllNearAndUnlocked([first, last]);
        res.json({
            status: "success",
            scooters: result
        });
	};
}

export default new ScooterController();
