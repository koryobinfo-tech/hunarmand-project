import { handleApi } from "@/lib/server/handle-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  return handleApi(req, ["health"]);
}
