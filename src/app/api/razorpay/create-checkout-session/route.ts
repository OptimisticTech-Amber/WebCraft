import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/utils";
import { createOrder } from "@/lib/razorpay";

// Create a Razorpay order for one-time payments.
export async function POST(req: NextRequest) {
  const {
    subAccountId,
    prices,
  }: {
    subAccountId: string;
    prices: { recurring: boolean; productId: string; amount?: number }[];
  } = await req.json();

  if (!subAccountId || !prices?.length) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  try {
    const subscriptionPriceExists = prices.find((p) => p.recurring);

    if (subscriptionPriceExists) {
      // For subscription flows, the client should hit a subscription endpoint.
      return NextResponse.json(
        { message: "Subscription requires server-side setup." },
        { status: 501 }
      );
    }

    const amount = Math.max(0, prices[0].amount ?? 0) * 100; // expect amount in major units

    const order = await createOrder({
      amount,
      currency: "INR",
      receipt: `subacct_${subAccountId}_${Date.now()}`,
      notes: { subAccountId },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err: any) {
    logger(err);
    return NextResponse.json(
      { message: err?.message || "Internal error" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
