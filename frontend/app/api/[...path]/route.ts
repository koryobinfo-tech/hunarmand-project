import { handleApi } from "@/lib/server/handle-api";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Ctx = { params: Promise<{ path: string[] }> };

async function run(req: Request, ctx: Ctx) {
  const { path } = await ctx.params;
  return handleApi(req, path || []);
}

export const GET = run;
export const POST = run;
export const PUT = run;
export const DELETE = run;
export const OPTIONS = run;
