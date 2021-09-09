import { Request, Response } from "express";
import ScooterService from "../../../services/scooter-service";
import { ScooterIdParamsDTO } from "./admin-scooters-dto";

class AdminScootersController {
    private scooterService = ScooterService.instance;

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
        req: Request<Partial<ScooterIdParamsDTO>>,
        res: Response
    ) => {
        const { id } = req.params as ScooterIdParamsDTO;
        const scooter = await this.scooterService.findId(id);
        res.json({
            status: "success",
            scooter
        });
    }

    toggleDisabled = async (
        req: Request<Partial<ScooterIdParamsDTO>>,
        res: Response
    ) => {
        const { id } = req.params as ScooterIdParamsDTO;
        const scooter = await this.scooterService.toggleDisabledStatus(id);
        res.json({
            status: "success",
            scooter
        });
    }

}
export default new AdminScootersController();