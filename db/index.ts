import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
import { getClinicEnv } from "./runtime-env";

export function getDb() {
  const binding = getClinicEnv()?.DB;
  if (!binding) {
    throw new Error(
      "D1 binding `DB` is unavailable in the current request context."
    );
  }

  return drizzle(binding, { schema });
}
