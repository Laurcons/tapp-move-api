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

    // TODO: merge price into ride
    async createCheckoutForRide(ride: Ride, price: number) {
        const data = {
            rideId: ride._id,
            for: "Scooter ride",
            currency: "RON",
            amount: price
        };

        const successToken = await JWTP.sign({
            ...data,
            status: "success"
        }, Config.get("JWT_SECRET"));
        const cancelToken = await JWTP.sign({
            ...data,
            status: "cancelled"
        }, Config.get("JWT_SECRET"));

        const session = await (async () => {
            if (ride.checkoutId) {
                try {
                    const sess = await stripe.checkout.sessions.retrieve(ride.checkoutId);
                    return sess;
                } catch (_) {}
            }
            return stripe.checkout.sessions.create({
                line_items: [{
                    name: "Scooter ride",
                    currency: "ron",
                    amount: price,
                    quantity: 1
                }],
                payment_method_types: [ 'card' ],
                mode: 'payment',
                success_url: `${Config.get("API_URL")}/pages/completePayment?token=${successToken}`,
                cancel_url: `${Config.get("API_URL")}/pages/completePayment?token=${cancelToken}`
            });
        })();
        return session;
    }

}

class PaymentsServiceInstance extends PaymentsService {}