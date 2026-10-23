import { connectDB } from "../../lib/mongodb";
import Order from "../../models/Order";

const backendOrigin = () => String(process.env.PAYIN_BACKEND_API_ORIGIN || "http://localhost:8001").replace(/\/+$/, "");

async function legacyPhonePeRedirect(path, requestUrl) {
  const legacyTransactionId = path[0];
  if (path.length !== 1 || !/^SP[A-Za-z0-9]+$/.test(legacyTransactionId)) return null;

  await connectDB();
  const order = await Order.findOne({ transactionId: legacyTransactionId }).select("orderId").lean();
  if (!order?.orderId) return null;

  const destination = new URL(`/pay/${encodeURIComponent(order.orderId)}`, requestUrl);
  destination.search = requestUrl.search;
  return Response.redirect(destination, 302);
}

async function forwardPaymentPage(request, context) {
  const { path = [] } = await context.params;
  const requestUrl = new URL(request.url);
  const upstreamUrl = new URL(`/pay/${path.map(encodeURIComponent).join("/")}`, `${backendOrigin()}/`);
  upstreamUrl.search = requestUrl.search;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");

  try {
    const response = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
      cache: "no-store",
      // The backend redirects Razorpay payment links to rzp.io. Forward that
      // redirect to the browser; do not fetch Razorpay HTML on this server.
      redirect: "manual",
      // Required by Node when a request body is streamed to fetch.
      duplex: "half",
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete("connection");
    responseHeaders.delete("keep-alive");
    responseHeaders.delete("transfer-encoding");
    if (response.status === 404) {
      const legacyRedirect = await legacyPhonePeRedirect(path, requestUrl);
      if (legacyRedirect) return legacyRedirect;
    }

    return new Response(response.body, { status: response.status, headers: responseHeaders });
  } catch (error) {
    return Response.json({ status: "error", error: "Payment page is temporarily unavailable" }, { status: 502 });
  }
}

export const dynamic = "force-dynamic";
export const GET = forwardPaymentPage;
export const HEAD = forwardPaymentPage;
export const POST = forwardPaymentPage;
