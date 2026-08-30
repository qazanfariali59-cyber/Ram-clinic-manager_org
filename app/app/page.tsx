import { getAccessUser } from "../access";
import { chatGPTSignOutPath, requireChatGPTUser } from "../chatgpt-auth";
import ClinicApp from "../clinic-app";
import PatientPortal from "../patient-portal";
import RamIntro from "../ram-intro";

export const dynamic = "force-dynamic";

const AI_ROLES = new Set([
  "مدیر سیستم",
  "پزشک",
  "پذیرش",
  "حسابداری",
  "داروخانه",
]);

export default async function AppHome() {
  const identity = await requireChatGPTUser("/app");
  const user = await getAccessUser();

  if (!user) {
    return (
      <main className="access-denied" dir="rtl">
        <section>
          <img src="/ram-brand.jpg" alt="نشان رام" />
          <h1>دسترسی در انتظار تأیید است</h1>
          <p>
            حساب {identity.email} شناسایی شد، اما مدیر سامانه هنوز نقشی برای آن
            فعال نکرده است.
          </p>
          <a href={chatGPTSignOutPath("/")} target="_top">
            خروج از حساب
          </a>
        </section>
      </main>
    );
  }

  if (user.role === "بیمار") return <PatientPortal user={user} />;

  return (
    <>
      <RamIntro />
      <ClinicApp user={user} />
      {AI_ROLES.has(user.role) && (
        <a
          href="/ai"
          aria-label="باز کردن دستیار هوش مصنوعی رام"
          style={{
            position: "fixed",
            left: 24,
            bottom: 24,
            zIndex: 90,
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            borderRadius: 18,
            border: "1px solid rgba(93,226,255,.24)",
            background:
              "linear-gradient(135deg,rgba(16,42,58,.96),rgba(20,31,62,.96))",
            boxShadow:
              "0 18px 55px rgba(0,0,0,.35),0 0 30px rgba(39,216,255,.11)",
            color: "#eafcff",
            textDecoration: "none",
            fontFamily: "Tahoma, Arial, sans-serif",
            fontSize: 13,
            fontWeight: 700,
            backdropFilter: "blur(18px)",
          }}
        >
          <span
            style={{
              width: 28,
              height: 28,
              display: "grid",
              placeItems: "center",
              borderRadius: 10,
              background: "linear-gradient(135deg,#28d9ef,#3877ff)",
              color: "#041016",
              fontSize: 12,
            }}
          >
            AI
          </span>
          <span>دستیار رام</span>
        </a>
      )}
    </>
  );
}
