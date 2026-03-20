// mobile_app\app\api\razorpay\create-subscription\route.ts
import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export const dynamic = "force-dynamic"; // ⭐ IMPORTANT

export async function POST(req: Request) {
  try {
    const { planId } = await req.json();

    if (!planId) {
      return NextResponse.json({ error: "Plan ID required" }, { status: 400 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 12,
      customer_notify: 1,
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
    });
  } catch (error) {
    console.error("Razorpay create subscription error:", error);

    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 },
    );
  }
}
