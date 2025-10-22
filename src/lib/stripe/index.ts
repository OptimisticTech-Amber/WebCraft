import Stripe from "stripe";


export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '',{
apiVersion: '2025-09-30.clover',
appInfo:{
    name: 'webcraft',
    version: '1.0.0'
}
} )