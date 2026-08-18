import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import { drizzle as drizzleProxy } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";
import { getClinicEnv } from "./runtime-env";

function createD1Db(binding: D1Database) {
  return drizzleD1(binding, { schema });
}

type ClinicDb = ReturnType<typeof createD1Db>;

type D1RawApiResponse = {
  success?: boolean;
  errors?: Array<{ message?: string }>;
  result?: Array<{
    success?: boolean;
    results?: { columns?: string[]; rows?: unknown[][] };
  }>;
};

let remoteDb: ClinicDb | null = null;

function remoteD1Credentials() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID?.trim();
  const apiToken = process.env.CLOUDFLARE_D1_API_TOKEN?.trim();
  return accountId && databaseId && apiToken
    ? { accountId, databaseId, apiToken }
    : null;
}

function createRemoteD1Db(): ClinicDb | null {
  const credentials = remoteD1Credentials();
  if (!credentials) return null;

  const proxy = drizzleProxy(async (sql, params) => {
    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(credentials.accountId)}/d1/database/${encodeURIComponent(credentials.databaseId)}/raw`;
    const body: { sql: string; params?: unknown[] } = { sql };
    if (params.length) body.params = params;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${credentials.apiToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    let payload: D1RawApiResponse | null = null;
    try {
      payload = await response.json() as D1RawApiResponse;
    } catch {
      payload = null;
    }

    const result = payload?.result?.[0];
    if (!response.ok || !payload?.success || !result?.success) {
      const detail = payload?.errors?.map((item) => item.message).filter(Boolean).join("; ");
      throw new Error(detail || `Remote D1 request failed with HTTP ${response.status}.`);
    }

    return { rows: result.results?.rows ?? [] };
  });

  return proxy as unknown as ClinicDb;
}

export function getDb(): ClinicDb {
  const binding = getClinicEnv()?.DB;
  if (binding) return createD1Db(binding);

  remoteDb ??= createRemoteD1Db();
  if (remoteDb) return remoteDb;

  throw new Error(
    "Database unavailable: provide the D1 binding `DB` or CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID and CLOUDFLARE_D1_API_TOKEN."
  );
}
