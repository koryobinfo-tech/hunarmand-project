import { handleApi } from "@/lib/server/handle-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

type Ctx = { params: Promise<{ path?: string[] }> | { path?: string[] } };

function partsFromRequest(req: Request, paramPath?: string[]) {
  const url = new URL(req.url);
  const fromUrl = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);
  if (fromUrl.length) return fromUrl;
  return paramPath?.filter(Boolean) || [];
}

async function run(req: Request, ctx: Ctx) {
  const raw = await Promise.resolve(ctx.params);
  return handleApi(req, partsFromRequest(req, raw?.path));
}

export const GET = run;
export const POST = run;
export const PUT = run;
export const DELETE = run;
export const OPTIONS = run;
