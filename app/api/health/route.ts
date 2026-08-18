import { sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { userAccounts } from "../../../db/schema";
import { getClinicEnv } from "../../db/runtime-env";

export const dynamic = "force-dynamic";

function storageMode() {
  if (getClinicEnv()?.DB) return "d1-binding";
  if (
    process.env.CLOUDFLARE_ACCOUNT_ID &&
    process.env.CLOUDFLARE_D1_DATABASE_ID &&
    process.env.CLOUDFLARE_D1_API_TOKEN
  ) return "d1-http-proxy";
  return "unconfigured";
}

export async function GET() {
  const mode = storageMode();
  try {
    const db = getDb();
    const [row] = await db.select({ count: sql<number>`count(*)` }).from(userAccounts).limit(1);
    return Response.json({
      ok: true,
      storage: { ok: true, mode, userAccountRows: Number(row?.count ?? 0) },
      ai: { configured: Boolean(process.env.OPENAI_API_KEY) },
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({
      ok: false,
      storage: { ok: false, mode },
      ai: { configured: Boolean(process.env.OPENAI_API_KEY) },
      error: error instanceof Error ? error.message : "Health check failed",
      serverTime: new Date().toISOString(),
    }, { status: 503 });
  }
}
