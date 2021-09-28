
import { Request, Response } from "express";
import ApiError from "../../api-error";
import PaymentsService from "../../services/payments-service";
import RideService from "../../services/ride-service";

class WebhooksController {
	private paymentsService = PaymentsService.instance;
    private rideService = RideService.instance;

    stripe = async (
        req: Request, res: Response
    ) => {
        const event = await (async () => {
            const sig = req.headers["stripe-signature"];
            if (!sig || Array.isArray(sig)) throw 'a';
            return this.paymentsService.verifyWebhookSignature(req.rawBody, sig);
        })().catch(() => { throw ApiError.stripe.invalidSignature; });

        res.sendStatus(200);

        switch (event.type) {
            case "payment_intent.succeeded":
            case "checkout.session.completed": {
                const object = event.data.object as any;
                const metadata: Record<string, string> = object.metadata;
                await this.rideService.endPayment(metadata.rideId);
            } break;
            case "checkout.session.expired": {
                const object = event.data.object as any;
                const metadata: Record<string, string> = object.metadata;
                await this.rideService.cancelPayment(metadata.rideId);
            } break;
        }

        console.log(event);
    }

}

export default new WebhooksController();