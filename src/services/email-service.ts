
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
			host: "smtp-relay.gmail.com",
			port: 587,
			secure: false,
			auth: {
				user: Config.get("GMAIL_USER"),
				pass: Config.get("GMAIL_PASSWORD"),
			},
		});
		await transporter.verify();
		return transporter;
	}

	async sendForgotPasswordEmail() {
		const transporter = await this.initializeSMTP();
		await transporter.sendMail({
			to: "Pricop Laurentiu <laurcons@outlook.com>",
			from: "Tapp MOVE <tapp.move.noreply@gmail.com>",
			html: "<h1>HELLO</h1>",
		});

		transporter.close();
	}
}
class EmailServiceInstance extends EmailService {}