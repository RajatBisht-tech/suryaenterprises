import { POST as checkStatusHandler } from "../../../payin/check-status/route";

export const dynamic = "force-dynamic";

export async function POST(request) {
  return checkStatusHandler(request);
}
