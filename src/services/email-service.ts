
import nodemailer from "nodemailer";
import Config from "../environment";

export default class EmailService {

    private async initializeSMTP() {
        const transporter = nodemailer.createTransport({
            host: "smtp-relay.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: Config.get("GMAIL_USER"),
                pass: Config.get("GMAIL_PASSWORD")
            }
        });
        await transporter.verify();
        return transporter;
    }

    async sendForgotPasswordEmail() {
        const transporter = await this.initializeSMTP();
        await transporter.sendMail({
            to: "Pricop Laurentiu <laurcons@outlook.com>",
            from: "Tapp MOVE <tapp.move.noreply@gmail.com>",
            html: "<h1>HELLO</h1>"
        });

        transporter.close();
    }

}