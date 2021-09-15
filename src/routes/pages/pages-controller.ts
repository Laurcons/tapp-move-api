import { plainToClass } from "class-transformer";
import { Request, Response } from "express";
import ApiError from "../../api-error";
import Config from "../../environment";
import { JWTP } from "../../jwt-promise";
import RideService from "../../services/ride-service";
import UserService from "../../services/user-service";
import { ForgotPasswordTokenQueryDTO } from "./pages-dto";
class PagesController {
	private userService = UserService.instance;
	private rideService = RideService.instance;

	getForgotPassword = async (req: Request, res: Response) => {
		function render(payload: any) {
			res.render("forgotPassword", payload);
		}
		const query = plainToClass(ForgotPasswordTokenQueryDTO, req.query);
		if (!query.token) {
			return render({ error: "token-not-found", form: false });
		}
		const token = query.token;
		const user = await this.userService.findUserWithForgotPasswordToken(
			token
		);
		if (!user) {
			return render({ error: "invalid-token", form: false });
		}
		render({ token, form: true });
	};

	postForgotPassword = async (req: Request, res: Response) => {
		const query = plainToClass(ForgotPasswordTokenQueryDTO, req.query);
		if (!query.token) {
			return res.render("forgotPassword", {
				error: "token-not-found",
				form: true,
			});
		}
	};

	getScooterPanel = async (req: Request, res: Response) => {
        res.render("scooterPanel");
    };

	paymentResult = async (req: Request, res: Response) => {
		const query = Object.keys(req.query);
		let additional: Record<string, any> = {};
		if (query.includes('success')) {
			if (!req.query.token) {
				throw ApiError.actionNotAllowed;
			}
			const data = await JWTP.verify(req.query.token as string, Config.get("JWT_SECRET"));
			await this.rideService.updateOne(
				{ _id: data.rideId },
				{ $set: { status: "completed" } }
			);
			additional.payment = {
				for: data.for,
				amount: parseFloat(data.amount) / 100,
				currency: data.currency,
			};
		}
		res.render("paymentResult", {
			success: query.includes('success'),
			cancel: query.includes('cancel'),
			...additional
		});
	};
}

export default new PagesController();
