
import { readFile } from "fs/promises";
import nodemailer from "nodemailer";
import Config from "../environment";

export default abstract class EmailService {
	private static _instance: EmailService | null = null;
	static get instance() {
		if (!this._instance) {
			this._instance = new EmailServiceInstance();
		}
		return this._instance;
	}

	private async initializeSMTP() {
		const transporter = nodemailer.createTransport({
			host: "smtp.gmail.com",
			port: 587,
			secure: false,
			tls: {
				ciphers: "SSLv3"
			},
			auth: {
				user: Config.get("GMAIL_USER"),
				pass: Config.get("GMAIL_PASSWORD"),
			},
		});
		await transporter.verify();
		return transporter;
	}

	async sendForgotPasswordEmail(token: string) {
		const transporter = await this.initializeSMTP();
		const template = await readFile("./src/routes/pages/email/forgotPassword.html");
		const keys: Record<string, string> = {
			RESETLINK:
				Config.get("API_URL") + 
				"/pages/forgotPassword?token=" +
				token
		};
		const body = ((content: string) => {
			let result = content;
			for (const key in keys) {
				result = result.split('[[' + key + ']]').join(keys[key]);
			}
			return result;
		})(template.toString());
		await transporter.sendMail({
			to: "Pricop Laurentiu <laurcons@outlook.com>",
			from: "Tapp MOVE <tapp.move.noreply@gmail.com>",
			html: body,
			subject: "Reset password request"
		});

		transporter.close();
	}
}
class EmailServiceInstance extends EmailService {}