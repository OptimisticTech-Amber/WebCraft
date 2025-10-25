import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/utils";
import { verifyWebhookSignature } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("x-razorpay-signature") || "";
    const bodyText = await req.text();

    // Verify signature; will throw if secret not set.
    let ok = false;
    try {
      ok = verifyWebhookSignature(bodyText, signature);
    } catch (err: any) {
      logger("Webhook verification failed:", err?.message || err);
      return NextResponse.json(
        { message: "webhook verification failed" },
        { status: 400 }
      );
    }

    if (!ok) {
      logger("Invalid webhook signature");
      return NextResponse.json(
        { message: "invalid signature" },
        { status: 400 }
      );
    }

    logger("Received verified webhook:", bodyText?.slice?.(0, 200));
    // TODO: parse event and handle relevant Razorpay events (payments, subscriptions)
    return NextResponse.json({ received: true });
  } catch (err: any) {
    logger(err);
    return NextResponse.json(
      { message: err?.message || "error" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
