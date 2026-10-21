import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CheckoutReceiptPage({ searchParams }) {
  const params = await searchParams;
  const txnId = params?.txnId || params?.transactionId || params?.orderId || params?.order_id;

  if (txnId) {
    redirect(`/pay/${encodeURIComponent(txnId)}`);
  }

  redirect("/checkout");
}
