import { Request, Response } from "express";
import { AdminAuthService } from "../../../services/admin-auth-service";
import { Admin } from "../admin-account/admin-model";
import { LoginBodyDTO } from "./auth-dto";

class AdminAuthController {
	private adminAuthService = new AdminAuthService();

	login = async (
		req: Request<{}, {}, LoginBodyDTO>,
		res: Response<{ status: string; token: string; admin: Admin }>
	) => {
		const { email, password } = req.body;
		const { jwt, admin } = await this.adminAuthService.login(
			email,
			password
		);
		res.json({
			status: "success",
			token: jwt,
			admin,
		});
	};

	logout = async (req: Request, res: Response) => {
        await this.adminAuthService.logout(req.session.admin);
        res.json({
            status: "success"
        });
    };

	verifyToken = async (req: Request, res: Response) => {
		// it's already handled by the auth middleware
		res.json({
			status: "success"
		});
	}
}

export default new AdminAuthController();
