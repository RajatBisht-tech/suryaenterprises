import { NextResponse } from "next/server";
import { POST as createPayInOrder } from "../../../v1/payin/create-order/route";
import { isSameOriginRequest } from "../../../../lib/requestOrigin";

export const dynamic = "force-dynamic";

// Browser checkout wrapper. The merchant API token stays server-side, so only
// requests coming from this site's own pages are accepted here.
export async function POST(request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ status: "error", error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    if (!Array.isArray(body?.items) || body.items.length === 0) {
      return NextResponse.json({ status: "error", error: "Refresh checkout and select products before paying." }, { status: 400 });
    }

    const provider = String(body?.provider || "").toLowerCase().trim();
    if (provider !== "payu" && provider !== "razorpay" && provider !== "phonepe") {
      return NextResponse.json({ status: "error", error: "Choose PayU, Razorpay, or PhonePe before continuing." }, { status: 400 });
    }

    const internalRequest = new Request(request.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.PAYIN_API_TOKEN || ""}`,
        "x-forwarded-for": request.headers.get("x-forwarded-for") || "",
        "user-agent": request.headers.get("user-agent") || "",
      },
      body: JSON.stringify({ ...body, provider }),
    });
    return await createPayInOrder(internalRequest);
  } catch (error) {
    console.error("Checkout Pay-In create error:", error);
    return NextResponse.json({ status: "error", error: "Unable to create payment" }, { status: 500 });
  }
}
