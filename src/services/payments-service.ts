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
        const token = await JWTP.sign({
            rideId: ride._id,
            for: "Scooter ride",
            currency: "RON",
            amount: price
        }, Config.get("JWT_SECRET"));
        const session = await stripe.checkout.sessions.create({
            line_items: [{
                name: "Scooter ride",
                currency: "ron",
                amount: price,
                quantity: 1
            }],
            payment_method_types: [ 'card' ],
            mode: 'payment',
            success_url: `${Config.get("API_URL")}/pages/paymentResult?success&token=${token}`,
            cancel_url: `${Config.get("API_URL")}/pages/paymentResult?cancel`
        });
        return session;
    }

}

class PaymentsServiceInstance extends PaymentsService {}