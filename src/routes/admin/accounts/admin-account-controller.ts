import { Request, Response } from "express";
import AdminAccountService from "../../../services/admin-account-service";

class AdminAccountController {
    private accountService = AdminAccountService.instance;

    getMe = async (
        req: Request, res: Response
    ) => {
        const admin = await this.accountService.findOne({ _id: req.session.admin._id });
        res.json({
            status: "success",
            admin
        });
    }

}
export default new AdminAccountController();