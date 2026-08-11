import { eq, sql } from "drizzle-orm";
import { getDb } from "../db";
import { userAccounts } from "../db/schema";
import { getChatGPTUser } from "./chatgpt-auth";

export const rolePermissions: Record<string, string[]> = {
  "مدیر سیستم": ["patient", "staff", "lead", "medication", "referral", "appointment", "transaction", "visit", "finance", "report", "service"],
  "پذیرش": ["patient", "lead", "referral", "appointment", "transaction", "service"], "پزشک": ["patient", "appointment", "visit", "report", "service"],
  "حسابداری": ["staff", "referral", "transaction", "finance", "report", "service"], "داروخانه": ["medication", "transaction", "finance", "report"],
  "همکار بیرونی": ["referral", "service"],
};
export type AccessUser = { email: string; displayName: string; role: string; colleagueName: string | null };

export async function getAccessUser(): Promise<AccessUser | null> {
  const identity = await getChatGPTUser();
  if (!identity) return null;
  const db = getDb();
  const email = identity.email.toLowerCase();
  const [existing] = await db.select().from(userAccounts).where(eq(userAccounts.email, email)).limit(1);
  if (existing?.status === "active") return { email, displayName: existing.displayName, role: existing.role, colleagueName: existing.colleagueName };
  if (existing) return null;
  const [countRow] = await db.select({ count: sql<number>`count(*)` }).from(userAccounts);
  if (Number(countRow?.count ?? 0) > 0) return null;
  const [created] = await db.insert(userAccounts).values({ id: `USR-${crypto.randomUUID().slice(0, 8)}`, email, displayName: identity.displayName, role: "مدیر سیستم" }).returning();
  return { email, displayName: created.displayName, role: created.role, colleagueName: null };
}
export function canAccess(user: AccessUser, entity: string) { return rolePermissions[user.role]?.includes(entity) ?? false; }
