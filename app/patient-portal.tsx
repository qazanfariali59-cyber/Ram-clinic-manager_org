"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type PortalUser = {
  displayName: string;
  email: string;
  patientId: string | null;
};

type PatientRecord = {
  id: string;
  name: string;
  nationalId: string;
  phone: string;
  birthDate: string | null;
  city: string | null;
  service: string | null;
  doctor: string | null;
  status: string;
  balance: number;
  createdAt: string;
};

type Appointment = {
  id: string;
  date: string;
  time: string;
  doctor: string;
  service: string;
  status: string;
  notes: string | null;
};

type Visit = {
  id: string;
  doctor: string;
  chiefComplaint: string | null;
  diagnosis: string | null;
  treatment: string | null;
  medications: string | null;
  followUpAt: string | null;
  createdAt: string;
};

type Transaction = {
  id: string;
  description: string;
  amount: number;
  status: string;
  createdAt: string;
};

type PortalPayload = {
  patients?: PatientRecord[];
  appointments?: Appointment[];
  visits?: Visit[];
  transactions?: Transaction[];
  error?: string;
};

type TimelineKind = "visit" | "appointment" | "payment" | "profile";
type TimelineItem = {
  id: string;
  kind: TimelineKind;
  title: string;
  detail: string;
  meta: string;
  at: string;
};

const kindLabels: Record<TimelineKind, string> = {
  visit: "درمان",
  appointment: "نوبت",
  payment: "مالی",
  profile: "پرونده",
};

function money(value: number) {
  return new Intl.NumberFormat("fa-IR").format(value);
}

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });
}

function appointmentDate(date: string, time: string) {
  const parsed = new Date(`${date}T${time || "00:00"}:00`);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toISOString();
}

export default function PatientPortal({ user }: { user: PortalUser }) {
  const [payload, setPayload] = useState<PortalPayload>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | TimelineKind>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/clinic", { cache: "no-store" });
      const next = await response.json() as PortalPayload;
      if (!response.ok) throw new Error(next.error || "دریافت پرونده ناموفق بود");
      setPayload(next);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "دریافت پرونده ناموفق بود");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const patient = payload.patients?.[0] ?? null;
  const timeline = useMemo(() => {
    if (!patient) return [];
    const items: TimelineItem[] = [
      {
        id: `profile-${patient.id}`,
        kind: "profile",
        title: "پرونده الکترونیک ایجاد شد",
        detail: patient.service || "ثبت اطلاعات پایه بیمار",
        meta: patient.doctor || "کلینیک رام",
        at: patient.createdAt,
      },
      ...(payload.appointments ?? []).map((item): TimelineItem => ({
        id: item.id,
        kind: "appointment",
        title: item.service,
        detail: item.notes || `وضعیت نوبت: ${item.status}`,
        meta: `${item.doctor} · ساعت ${item.time}`,
        at: appointmentDate(item.date, item.time),
      })),
      ...(payload.visits ?? []).map((item): TimelineItem => ({
        id: item.id,
        kind: "visit",
        title: item.diagnosis || item.chiefComplaint || "یادداشت درمانی",
        detail: [item.treatment, item.medications && `دارو: ${item.medications}`].filter(Boolean).join(" · ") || "جزئیات درمان در پرونده ثبت شد",
        meta: `${item.doctor}${item.followUpAt ? ` · پیگیری ${item.followUpAt}` : ""}`,
        at: item.createdAt,
      })),
      ...(payload.transactions ?? []).map((item): TimelineItem => ({
        id: item.id,
        kind: "payment",
        title: item.description,
        detail: `${money(item.amount)} تومان · ${item.status === "paid" ? "پرداخت‌شده" : "در انتظار تسویه"}`,
        meta: "گردش مالی پرونده",
        at: item.createdAt,
      })),
    ];
    return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [patient, payload.appointments, payload.transactions, payload.visits]);

  const visibleTimeline = filter === "all" ? timeline : timeline.filter((item) => item.kind === filter);

  if (loading) {
    return <main className="patient-portal loading" dir="rtl"><div className="portal-loader"/><p>در حال آماده‌سازی پرونده شما...</p></main>;
  }

  if (error || !user.patientId || !patient) {
    return (
      <main className="patient-portal portal-state" dir="rtl">
        <img src="/ram-brand.jpg" alt="نشان رام" />
        <h1>{error ? "پرونده موقتاً در دسترس نیست" : "حساب شما هنوز به پرونده متصل نشده است"}</h1>
        <p>{error || "از پذیرش کلینیک بخواهید حساب شما را به پرونده درست متصل کند."}</p>
        <div><button onClick={() => void load()}>تلاش دوباره</button><a href="/signout-with-chatgpt?return_to=/">خروج</a></div>
      </main>
    );
  }

  return (
    <main className="patient-portal" dir="rtl">
      <header className="portal-topbar">
        <div className="portal-brand"><img src="/ram-brand.jpg" alt="نشان رام"/><span><strong>رام</strong><small>پرونده من</small></span></div>
        <div className="portal-user"><span>{user.displayName.slice(0, 1)}</span><p><strong>{user.displayName}</strong><small>{user.email}</small></p><a href="/signout-with-chatgpt?return_to=/">خروج</a></div>
      </header>

      <section className="portal-hero">
        <div><span className="portal-eyebrow">پرونده الکترونیک بیمار</span><h1>{patient.name}</h1><p>اطلاعات این صفحه فقط به حساب متصل به همین پرونده نمایش داده می‌شود.</p></div>
        <button onClick={() => void load()}>به‌روزرسانی پرونده</button>
      </section>

      <section className="portal-summary">
        <article><small>کد پرونده</small><strong>{patient.id}</strong></article>
        <article><small>پزشک مسئول</small><strong>{patient.doctor || "در انتظار تعیین"}</strong></article>
        <article><small>خدمت جاری</small><strong>{patient.service || "ثبت نشده"}</strong></article>
        <article><small>مانده حساب</small><strong>{patient.balance ? `${money(patient.balance)} تومان` : "تسویه"}</strong></article>
      </section>

      <section className="portal-grid">
        <article className="portal-card portal-profile">
          <header><span>اطلاعات پایه</span><h2>مشخصات پرونده</h2></header>
          <dl><div><dt>کد ملی</dt><dd>{patient.nationalId}</dd></div><div><dt>موبایل</dt><dd>{patient.phone}</dd></div><div><dt>تاریخ تولد</dt><dd>{patient.birthDate || "—"}</dd></div><div><dt>شهر</dt><dd>{patient.city || "—"}</dd></div><div><dt>وضعیت</dt><dd>{patient.status}</dd></div></dl>
          <p>برای تغییر اطلاعات هویتی با پذیرش تماس بگیرید؛ سوابق بالینی از این پنل قابل ویرایش نیست.</p>
        </article>

        <article className="portal-card portal-timeline-card">
          <header className="portal-timeline-head"><div><span>مسیر درمان</span><h2>تایملاین پرونده</h2></div><div className="portal-filters">{(["all", "visit", "appointment", "payment"] as const).map((value) => <button key={value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{value === "all" ? "همه" : kindLabels[value]}</button>)}</div></header>
          <div className="portal-timeline">
            {visibleTimeline.map((item) => <article key={`${item.kind}-${item.id}`} className={`timeline-item ${item.kind}`}><i/><div><div><span>{kindLabels[item.kind]}</span><time>{dateLabel(item.at)}</time></div><h3>{item.title}</h3><p>{item.detail}</p><small>{item.meta}</small></div></article>)}
            {!visibleTimeline.length && <div className="portal-empty"><strong>رویدادی در این دسته ثبت نشده است</strong><small>پس از ثبت نوبت یا ویزیت، این بخش خودکار به‌روز می‌شود.</small></div>}
          </div>
        </article>
      </section>
    </main>
  );
}
