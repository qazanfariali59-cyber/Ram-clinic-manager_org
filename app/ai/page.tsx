import Link from "next/link";
import { getAccessUser } from "../access";
import { requireChatGPTUser } from "../chatgpt-auth";
import AiClient from "./ai-client";

export const dynamic = "force-dynamic";

const INTERNAL_ROLES = new Set(["مدیر سیستم", "پزشک", "پذیرش", "حسابداری", "داروخانه"]);

export default async function AiPage() {
  await requireChatGPTUser("/ai");
  const user = await getAccessUser();

  if (!user) {
    return (
      <main dir="rtl" style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#071018", color: "#eafaff", fontFamily: "Tahoma, Arial" }}>
        <section>
          <h1>دسترسی معتبر نیست</h1>
          <Link href="/" style={{ color: "#46dcef" }}>بازگشت</Link>
        </section>
      </main>
    );
  }

  if (!INTERNAL_ROLES.has(user.role)) {
    return (
      <main dir="rtl" style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#071018", color: "#eafaff", fontFamily: "Tahoma, Arial" }}>
        <section style={{ maxWidth: 520, padding: 30, textAlign: "center" }}>
          <h1>RAM AI برای کاربران داخلی فعال است</h1>
          <p style={{ color: "#8ba8b5", lineHeight: 1.9 }}>نقش فعلی شما دسترسی به دستیار مدیریتی هوش مصنوعی ندارد.</p>
          <Link href="/" style={{ color: "#46dcef" }}>بازگشت به سامانه</Link>
        </section>
      </main>
    );
  }

  return <AiClient displayName={user.displayName} role={user.role} />;
}
