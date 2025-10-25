import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/utils";

export async function POST(_req: NextRequest) {
  // Razorpay subscriptions require plans/products and are more involved.
  // Implementing full subscription management is out-of-scope for this automatic
  // conversion. Return 501 with guidance.
  return NextResponse.json(
    {
      message:
        "Subscriptions are not implemented yet. To support subscriptions implement Razorpay plans and subscription creation on the server.",
    },
    { status: 501 }
  );
}
