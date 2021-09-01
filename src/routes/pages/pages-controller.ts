import { plainToClass } from "class-transformer";
import { Request, Response } from "express";
import UserService from "../../services/user-service";
import { ForgotPasswordTokenQueryDTO } from "./pages-dto";
class PagesController {
	userService = UserService.instance;

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
}

export default new PagesController();
