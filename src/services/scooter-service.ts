import { Scooter, ScooterModel } from "../models/scooter-model";
import CrudService from "./crud-service";

export default class ScooterService extends CrudService<Scooter> {
	constructor() {
		super(ScooterModel);
	}

    async findAllNearAndUnbooked(coordinates: [number, number]) {
        return await this.model.find({
			location: {
				$nearSphere: {
					$geometry: {
						type: "Point",
						coordinates,
					},
					$maxDistance: 4000,
				},
			},
			isBooked: false,
		});
    }

}