"use server";

import Stripe from "stripe";
import { db } from "../db";
import { stripe } from ".";

export const subscriptionCreated = async (
  subscription: Stripe.Subscription,
  customerId: string
) => {
  try {
    const agency = await db.agency.findFirst({
      where: { customerId },
      include: {
        SubAccount: true,
      },
    });

    if (!agency) {
      throw new Error("Could not find an agency to upsert the subscription");
    }

    // Get the price from the subscription items (new Stripe API way)
    const price = subscription.items.data[0]?.price;
    if (!price) {
      throw new Error("No price found in subscription");
    }

    // Map price ID to Plan enum
    const planMapping: {
      [key: string]:
        | "price_1OYxkqFj9oKEERu1NbKUxXxN"
        | "price_1OYxkqFj9oKEERu1KfJGWxgN";
    } = {
      price_1OYxkqFj9oKEERu1NbKUxXxN: "price_1OYxkqFj9oKEERu1NbKUxXxN",
      price_1OYxkqFj9oKEERu1KfJGWxgN: "price_1OYxkqFj9oKEERu1KfJGWxgN",
    };

    const data = {
      active: subscription.status === "active",
      agencyId: agency.id,
      customerId,
      currentPeriodEndDate: new Date(
        (subscription as any).current_period_end * 1000
      ),
      priceId: price.id,
      subscritiptionId: subscription.id, // Note: keeping the typo to match database schema
      plan: planMapping[price.id] || null,
    };

    const res = await db.subscription.upsert({
      where: {
        agencyId: agency.id,
      },
      create: data,
      update: data,
    });

    console.log("Subscription upserted successfully:", res.id);
    return res;
  } catch (error) {
    console.error("Error upserting subscription:", error);
    throw error; // Re-throw to allow proper error handling upstream
  }
};


export const getConnectAccountProducts = async (stripeAccount: string) => {
  const products = await stripe.products.list(
    {
      limit: 50,
      expand: ["data.default_price"],
    },
    {
      stripeAccount,
    },
  );

  return products.data;
};