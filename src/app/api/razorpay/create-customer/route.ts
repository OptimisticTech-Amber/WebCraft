import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";
import { logger } from "@/lib/utils";

export async function POST(req: NextRequest) {
  // Minimal replacement for Stripe customer creation. Razorpay customers can be
  // created via their API; for now generate a local id and (optionally) attach to agency.
  const { email, address, name, shipping, agencyId } = await req.json();

  if (!email || !name) {
    return NextResponse.json("Missing required fields", { status: 400 });
  }

  try {
    const customerId = `rzp_cust_${uuidv4()}`;

    if (agencyId) {
      await db.agency.update({ where: { id: agencyId }, data: { customerId } });
    }

    return NextResponse.json({ customerId });
  } catch (err: any) {
    logger(err);
    return NextResponse.json("Internal server error", { status: 500 });
  }
}
