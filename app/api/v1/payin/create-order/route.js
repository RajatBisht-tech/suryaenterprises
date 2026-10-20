import { POST as createOrderHandler } from "../../../payin/create-order/route";

export const dynamic = "force-dynamic";

export async function POST(request) {
  return createOrderHandler(request);
}
