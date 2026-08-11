import ClinicApp from "./clinic-app";
import { getAccessUser } from "./access";
import { requireChatGPTUser } from "./chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  await requireChatGPTUser("/");
  const user = await getAccessUser();
  if (!user) return <main className="access-denied" dir="rtl"><section><img src="/ram-brand.jpg" alt="نشان رام"/><h1>دسترسی در انتظار تأیید است</h1><p>حساب شما شناسایی شد، اما مدیر سامانه هنوز نقشی برای آن فعال نکرده است.</p><a href="/signout-with-chatgpt?return_to=/">خروج از حساب</a></section></main>;
  return <ClinicApp user={user} />;
}
