import { eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { appointments, medicalServices, patients, referrals, staff } from "../../../db/schema";
import { getAccessUser } from "../../access";

export const dynamic = "force-dynamic";

const INTERNAL_ROLES = new Set(["مدیر سیستم", "پزشک", "پذیرش", "حسابداری", "داروخانه"]);
const MAX_MESSAGE_LENGTH = 4000;

function tehranDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

async function clinicSnapshot() {
  const db = getDb();
  const today = tehranDate();
  const [patientRows, staffRows, referralRows, serviceRows, appointmentRows, todayAppointmentRows] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(patients),
    db.select({ count: sql<number>`count(*)` }).from(staff),
    db.select({ count: sql<number>`count(*)` }).from(referrals),
    db.select({ count: sql<number>`count(*)` }).from(medicalServices).where(eq(medicalServices.active, true)),
    db.select({ count: sql<number>`count(*)` }).from(appointments),
    db.select({ count: sql<number>`count(*)` }).from(appointments).where(eq(appointments.date, today)),
  ]);

  return {
    date: today,
    patients: Number(patientRows[0]?.count ?? 0),
    staff: Number(staffRows[0]?.count ?? 0),
    referrals: Number(referralRows[0]?.count ?? 0),
    activeServices: Number(serviceRows[0]?.count ?? 0),
    appointments: Number(appointmentRows[0]?.count ?? 0),
    todayAppointments: Number(todayAppointmentRows[0]?.count ?? 0),
  };
}

function extractText(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const response = payload as {
    output_text?: string;
    output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
  };
  if (typeof response.output_text === "string" && response.output_text.trim()) return response.output_text.trim();
  return (response.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter((item) => item.type === "output_text" && typeof item.text === "string")
    .map((item) => item.text as string)
    .join("\n")
    .trim();
}

export async function POST(request: Request) {
  try {
    const user = await getAccessUser();
    if (!user) return Response.json({ error: "ورود معتبر نیست" }, { status: 401 });
    if (!INTERNAL_ROLES.has(user.role)) return Response.json({ error: "دستیار هوش مصنوعی فقط برای کاربران داخلی کلینیک فعال است" }, { status: 403 });

    const payload = await request.json() as { message?: unknown };
    const message = typeof payload.message === "string" ? payload.message.trim() : "";
    if (!message) return Response.json({ error: "پیام خالی است" }, { status: 400 });
    if (message.length > MAX_MESSAGE_LENGTH) return Response.json({ error: "پیام بیش از حد طولانی است" }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return Response.json({ error: "کلید OpenAI هنوز در محیط سرور تنظیم نشده است" }, { status: 503 });

    const snapshot = await clinicSnapshot();
    const instructions = [
      "تو دستیار هوش مصنوعی مدیریتی کلینیک چندتخصصی درد رام هستی.",
      "پاسخ‌ها را به فارسی روان، حرفه‌ای، کوتاه و عملی ارائه کن.",
      `نقش کاربر فعلی: ${user.role}.`,
      "فقط از داده‌های عملیاتی تجمیعی زیر به عنوان واقعیت سامانه استفاده کن و هیچ عددی را حدس نزن:",
      JSON.stringify(snapshot),
      "اطلاعات هویتی بیمار، کد ملی، شماره تماس یا نام بیمار در context خودکار برای تو ارسال نمی‌شود.",
      "اگر کاربر اطلاعات شناسایی بیمار را در پیام وارد کرد، از تکرار غیرضروری آن در پاسخ خودداری کن.",
      "برای پرسش‌های بالینی، پاسخ را به عنوان پشتیبان تصمیم‌گیری ارائه کن، عدم قطعیت و نیاز به قضاوت پزشک را مشخص کن و در صورت کمبود داده نتیجه قطعی نساز.",
      "در این نسخه اجازه تغییر مستقیم پرونده، تراکنش یا نوبت را نداری. اگر کاربر درخواست تغییر داد، فقط مراحل پیشنهادی را توضیح بده.",
    ].join("\n");

    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5.6",
        instructions,
        input: message,
        store: false,
      }),
    });

    if (!openaiResponse.ok) {
      return Response.json({ error: "ارتباط با سرویس هوش مصنوعی ناموفق بود" }, { status: 502 });
    }

    const result = await openaiResponse.json();
    const text = extractText(result);
    if (!text) return Response.json({ error: "پاسخ قابل نمایش دریافت نشد" }, { status: 502 });

    return Response.json({ text, model: "gpt-5.6", snapshot });
  } catch {
    return Response.json({ error: "پردازش درخواست هوش مصنوعی ناموفق بود" }, { status: 500 });
  }
}
