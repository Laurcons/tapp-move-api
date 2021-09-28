import { JWTP } from './../jwt-promise';

import Stripe from "stripe";
import Config from "../environment";
import { Ride } from "../routes/ride/ride-model";

const stripe = new Stripe(Config.get("STRIPE_SECRET"), {
    apiVersion: '2020-08-27'
});

export default abstract class PaymentsService {

    private static _instance: PaymentsService;
    static get instance() {
        if (!this._instance) this._instance = new PaymentsServiceInstance();
        return this._instance;
    }

    async createCheckoutForRide(ride: Ride) {
        const data = {
            rideId: ride._id,
            for: "Scooter ride",
            currency: "RON",
            amount: ride.price
        };

        const successToken = await JWTP.sign({
            ...data,
            status: "success"
        });
        const cancelToken = await JWTP.sign({
            ...data,
            status: "cancelled"
        });

        const session = await (async () => {
            if (ride.checkoutId) {
                try {
                    const sess = await stripe.checkout.sessions.retrieve(ride.checkoutId);
                    if (!sess || !sess.url)
                        throw "a";
                    return sess;
                } catch (_) {}
            }
            return stripe.checkout.sessions.create({
                line_items: [{
                    name: "Scooter ride",
                    currency: "ron",
                    amount: ride.price,
                    quantity: 1
                }],
                payment_method_types: [ 'card' ],
                mode: 'payment',
                success_url: `${Config.get("API_URL")}/pages/completePayment?token=${successToken}`,
                cancel_url: `${Config.get("API_URL")}/pages/completePayment?token=${cancelToken}`,
                metadata: {
                    rideId: ride._id.toString()
                }
            });
        })();
        return session;
    }

    async verifyWebhookSignature(body: string, signature: string) {
        return stripe.webhooks.constructEvent(body, signature, Config.get("STRIPE_WEBHOOK_SECRET"));
    }

    async createPaymentIntentForRide(ride: Ride) {
        const customer = await stripe.customers.create({
            name: "Georgilă Georgescu"
        });
        const ephemeralKey = await stripe.ephemeralKeys.create({ customer: customer.id }, { apiVersion: "2020-08-27" });
        const paymentIntent = await stripe.paymentIntents.create({
            amount: ride.price,
            currency: 'ron',
            customer: customer.id,
            metadata: {
                rideId: ride._id.toString()
            },
        });
        return {
            paymentIntent: paymentIntent.client_secret,
            ephemeralKey: ephemeralKey.secret,
            customer: customer.id,
            publishableKey: Config.get("STRIPE_PUBLISHABLE"),
            ride: ride.toObject()
        };
    }

}

class PaymentsServiceInstance extends PaymentsService {}