"use client";

import { useEffect, useMemo, useState } from "react";
import AccessView, { type UserAccountRecord } from "./access-view";
import ServicesView, { type MedicalServiceRecord, type ServiceShareRecord, type TariffSettingsRecord } from "./services-view";

type NavKey =
  | "dashboard"
  | "patients"
  | "appointments"
  | "crm"
  | "personnel"
  | "referrals"
  | "pharmacy"
  | "finance"
  | "services"
  | "users"
  | "reports";

type IconName =
  | "grid"
  | "users"
  | "calendar"
  | "pulse"
  | "briefcase"
  | "share"
  | "pill"
  | "wallet"
  | "services"
  | "chart"
  | "search"
  | "bell"
  | "plus"
  | "arrow"
  | "check"
  | "clock"
  | "warning"
  | "more";

const iconPaths: Record<IconName, React.ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
  pulse: <><path d="M3 12h4l2.2-6 4.3 12 2.1-6H21"/></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/></>,
  share: <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/></>,
  pill: <><path d="M10.5 20.5 3.5 13.5a5 5 0 0 1 7-7l7 7a5 5 0 0 1-7 7Z"/><path d="m8 9 7 7"/></>,
  wallet: <><path d="M20 7V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h16v10a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V6"/><path d="M16 14h2"/></>,
  services: <><path d="M4 5h16M4 12h16M4 19h16"/><circle cx="8" cy="5" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="10" cy="19" r="2"/></>,
  chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20V7"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  arrow: <><path d="m15 18-6-6 6-6"/></>,
  check: <><path d="m5 12 4 4L19 6"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  warning: <><path d="M10.3 3.8 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></>,
  more: <><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></>,
};

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconPaths[name]}
    </svg>
  );
}

const navItems: { key: NavKey; label: string; icon: IconName; badge?: string }[] = [
  { key: "dashboard", label: "نمای کلی", icon: "grid" },
  { key: "patients", label: "بیماران", icon: "users" },
  { key: "appointments", label: "نوبت‌ها و پذیرش", icon: "calendar" },
  { key: "crm", label: "ارتباط با بیمار (CRM)", icon: "pulse" },
  { key: "personnel", label: "پرسنل و شیفت‌ها", icon: "briefcase" },
  { key: "referrals", label: "همکاران و ارجاعات", icon: "share" },
  { key: "pharmacy", label: "داروخانه", icon: "pill" },
  { key: "finance", label: "مالی و تسویه", icon: "wallet" },
  { key: "services", label: "خدمات و تعرفه‌ها", icon: "services" },
  { key: "users", label: "کاربران و دسترسی", icon: "users" },
  { key: "reports", label: "گزارش‌ها", icon: "chart" },
];

const roles = ["مدیر سیستم", "پذیرش", "پزشک", "حسابداری", "داروخانه", "همکار بیرونی"];

type Patient = {
  id: string;
  nationalId: string;
  name: string;
  phone: string;
  age: string;
  service: string;
  doctor: string;
  lastVisit: string;
  createdAt: string;
  status: string;
  balance: number;
  tags: string[];
};

type StaffMember = {
  id: string;
  name: string;
  initials: string;
  personnelType: "داخلی" | "بیرونی";
  role: string;
  specialty: string;
  phone: string;
  shift: string;
  status: string;
  revenueShare: number;
  tone: string;
};

type Lead = {
  id: string;
  name: string;
  phone: string;
  source: string;
  service: string;
  owner: string;
  stage: "new" | "contacted" | "booked" | "treated";
  nextAction: string;
  value: number;
};

type Medication = {
  id: string;
  name: string;
  genericName: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  unitPrice: number;
  batch: string;
  expiresAt: string;
  supplier: string;
};

type Referral = {
  id: string;
  colleague: string;
  specialty: string;
  referrals: number;
  converted: number;
  amount: number;
  due: number;
  lastReferral: string;
  tone: string;
};

type AppointmentRecord = {
  id: string;
  patientId: string | null;
  patientName: string;
  nationalId: string | null;
  date: string;
  time: string;
  doctor: string;
  service: string;
  room: string | null;
  status: "scheduled" | "arrived" | "in_progress" | "completed" | "cancelled";
  notes: string | null;
};

type TransactionRecord = {
  id: string;
  patientId: string | null;
  counterparty: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string | null;
  status: "paid" | "partial" | "pending";
  createdAt: string;
};

type VisitRecord = {
  id: string; patientId: string; doctor: string; chiefComplaint: string | null; diagnosis: string | null;
  treatment: string | null; medications: string | null; followUpAt: string | null; createdAt: string;
};

type PatientTimelineItem = {
  id: string;
  kind: "visit" | "appointment" | "payment" | "profile";
  title: string;
  detail: string;
  meta: string;
  at: string;
};

const permissions: Record<string, NavKey[]> = {
  "مدیر سیستم": navItems.map((item) => item.key),
  "پذیرش": ["dashboard", "patients", "appointments", "crm", "referrals", "services"],
  "پزشک": ["dashboard", "patients", "appointments", "services", "reports"],
  "حسابداری": ["dashboard", "personnel", "referrals", "finance", "services", "reports"],
  "داروخانه": ["dashboard", "pharmacy", "finance", "reports"],
  "همکار بیرونی": ["dashboard", "referrals", "services"],
};

function fa(value: number) {
  return new Intl.NumberFormat("fa-IR").format(value);
}

function toman(value: number) {
  if (value >= 1_000_000) return `${fa(Math.round(value / 100_000) / 10)} میلیون`;
  return fa(value);
}

async function persist(entity: string, data: Record<string, unknown>) {
  const response = await fetch("/api/clinic", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ entity, data }),
  });
  const payload = await response.json() as { error?: string; record?: Record<string, unknown>; [key: string]: unknown };
  if (!response.ok) throw new Error(payload.error || "ذخیره اطلاعات ناموفق بود");
  return payload;
}

async function persistUpdate(entity: string, id: string, data: Record<string, unknown>) {
  const response = await fetch("/api/clinic", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ entity, id, data }),
  });
  const payload = await response.json() as { error?: string };
  if (!response.ok) throw new Error(payload.error || "به‌روزرسانی ناموفق بود");
}

function formatToday() {
  try {
    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  } catch {
    return "امروز";
  }
}

function ModuleHeader({
  eyebrow,
  title,
  description,
  action,
  onAction,
  secondaryAction,
  onSecondary,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
  secondaryAction?: string;
  onSecondary?: () => void;
}) {
  return (
    <section className="module-header">
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="module-actions">
        {secondaryAction && <button className="secondary-button" onClick={onSecondary}>{secondaryAction}</button>}
        {action && <button className="primary-button" onClick={onAction}><Icon name="plus" size={18} />{action}</button>}
      </div>
    </section>
  );
}

function MetricCard({ label, value, detail, tone, icon }: { label: string; value: string; detail: string; tone: string; icon: IconName }) {
  return (
    <article className={`metric-card ${tone}`}>
      <span className="metric-icon"><Icon name={icon} size={19} /></span>
      <div><small>{label}</small><strong>{value}</strong><p>{detail}</p></div>
    </article>
  );
}

function Modal({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <header><div><span>سامانه رام</span><h2>{title}</h2><p>{subtitle}</p></div><button onClick={onClose} aria-label="بستن">×</button></header>
        {children}
      </section>
    </div>
  );
}

function WorkspaceView({
  active,
  role,
  patients,
  staff,
  leads,
  setLeads,
  medications,
  referrals,
  appointmentRecords,
  transactions,
  visits,
  services,
  serviceShares,
  tariffSettings,
  users,
  currentEmail,
  currentColleagueName,
  reloadData,
  showToast,
}: {
  active: Exclude<NavKey, "dashboard">;
  role: string;
  patients: Patient[];
  staff: StaffMember[];
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  medications: Medication[];
  referrals: Referral[];
  appointmentRecords: AppointmentRecord[];
  transactions: TransactionRecord[];
  visits: VisitRecord[];
  services: MedicalServiceRecord[];
  serviceShares: ServiceShareRecord[];
  tariffSettings: TariffSettingsRecord | null;
  users: UserAccountRecord[];
  currentEmail: string;
  currentColleagueName: string | null;
  reloadData: () => Promise<void>;
  showToast: (message: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("همه");
  const [modal, setModal] = useState<"patient" | "appointment" | "lead" | "staff" | "referral" | "medication" | "sale" | "income" | "expense" | "visit" | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [busy, setBusy] = useState(false);

  const normalized = query.trim().toLowerCase();
  const filteredPatients = patients.filter((patient) => {
    const matchQuery = !normalized || `${patient.name} ${patient.nationalId} ${patient.phone}`.toLowerCase().includes(normalized);
    const matchFilter = filter === "همه" || patient.status === filter;
    return matchQuery && matchFilter;
  });
  const filteredStaff = staff.filter((member) => (filter === "همه" || member.personnelType === filter) && (!normalized || `${member.name} ${member.role} ${member.specialty}`.toLowerCase().includes(normalized)));
  const filteredMedications = medications.filter((item) => !normalized || `${item.name} ${item.genericName} ${item.category}`.toLowerCase().includes(normalized));
  const activeServices = services.filter((item) => item.active);
  const selectedPatientTimeline = useMemo(() => {
    if (!selectedPatient) return [];
    const events: PatientTimelineItem[] = [
      { id: `profile-${selectedPatient.id}`, kind: "profile", title: "ایجاد پرونده الکترونیک", detail: selectedPatient.service || "ثبت اطلاعات پایه بیمار", meta: selectedPatient.doctor || "کلینیک رام", at: selectedPatient.createdAt },
      ...visits.filter((item) => item.patientId === selectedPatient.id).map((item): PatientTimelineItem => ({ id: item.id, kind: "visit", title: item.diagnosis || item.chiefComplaint || "یادداشت درمانی", detail: item.treatment || item.medications || "جزئیات بالینی ثبت شد", meta: item.doctor, at: item.createdAt })),
      ...appointmentRecords.filter((item) => item.patientId === selectedPatient.id).map((item): PatientTimelineItem => ({ id: item.id, kind: "appointment", title: item.service, detail: item.notes || `وضعیت: ${item.status}`, meta: `${item.doctor} · ${item.time}`, at: `${item.date}T${item.time || "00:00"}:00` })),
      ...transactions.filter((item) => item.patientId === selectedPatient.id).map((item): PatientTimelineItem => ({ id: item.id, kind: "payment", title: item.description, detail: `${toman(item.amount)} تومان · ${item.status === "paid" ? "پرداخت‌شده" : "باز"}`, meta: "گردش مالی پرونده", at: item.createdAt })),
    ];
    return events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [appointmentRecords, selectedPatient, transactions, visits]);
  const completedAppointments = appointmentRecords.filter((item)=>item.status==="completed").length;
  const reportIncome = transactions.filter((item)=>item.category!=="expense"&&item.status==="paid").reduce((sum,item)=>sum+item.amount,0);
  const serviceMap = appointmentRecords.reduce<Record<string,number>>((acc,item)=>{acc[item.service]=(acc[item.service]||0)+1;return acc;},{});
  const serviceStats = Object.entries(serviceMap).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const maxService = Math.max(1,...serviceStats.map((item)=>item[1]));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    setBusy(true);
    try {
      if (modal === "patient") {
        await persist("patient", { ...data, tags: ["پذیرش جدید"] });
        showToast("پرونده بیمار با موفقیت ثبت شد");
      }
      if (modal === "lead") {
        await persist("lead", { ...data, stage: "new", nextAction: "تماس اولیه" });
        showToast("سرنخ جدید به CRM اضافه شد");
      }
      if (modal === "staff") {
        await persist("staff", data);
        showToast("همکار جدید ثبت شد");
      }
      if (modal === "medication") {
        await persist("medication", data);
        showToast("قلم دارویی به موجودی اضافه شد");
      }
      if (modal === "referral") {
        await persist("referral", data);
        showToast("ارجاع با کد ملی بیمار ثبت شد");
      }
      if (modal === "appointment") {
        await persist("appointment", data);
        showToast("نوبت جدید در تقویم ثبت شد");
      }
      if (modal === "sale") {
        await persist("sale", data);
        showToast("فروش و تراکنش مالی داروخانه ثبت شد");
      }
      if (modal === "income" || modal === "expense") {
        await persist("transaction", { ...data, category: modal === "expense" ? "expense" : "service" });
        showToast(modal === "expense" ? "هزینه ثبت شد" : "دریافت ثبت شد");
      }
      if (modal === "visit" && selectedPatient) {
        await persist("visit", { ...data, patientId: selectedPatient.id });
        showToast("یادداشت درمانی در پرونده بیمار ثبت شد");
      }
      await reloadData();
      setModal(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "ثبت اطلاعات ناموفق بود");
    } finally {
      setBusy(false);
    }
  }

  function moveLead(lead: Lead, direction: 1 | -1) {
    const stages: Lead["stage"][] = ["new", "contacted", "booked", "treated"];
    const next = stages[Math.max(0, Math.min(stages.length - 1, stages.indexOf(lead.stage) + direction))];
    setLeads((old) => old.map((item) => item.id === lead.id ? { ...item, stage: next } : item));
    void persistUpdate("lead", lead.id, { stage: next }).catch(() => undefined);
    showToast("مرحله پیگیری به‌روزرسانی شد");
  }

  const modalLayer = modal ? (
    <Modal
      title={modal === "patient" ? "پذیرش بیمار جدید" : modal === "appointment" ? "رزرو نوبت جدید" : modal === "lead" ? "سرنخ جدید CRM" : modal === "staff" ? "ثبت همکار جدید" : modal === "referral" ? "ثبت ارجاع جدید" : modal === "medication" ? "افزودن قلم دارویی" : modal === "income" ? "ثبت دریافت" : modal === "expense" ? "ثبت هزینه" : modal === "visit" ? "ثبت یادداشت درمانی" : "ثبت فروش داروخانه"}
      subtitle={modal === "referral" ? "برای ثبت اولیه فقط کد ملی بیمار کافی است" : "اطلاعات اصلی را وارد کنید؛ جزئیات بعداً قابل تکمیل است"}
      onClose={() => setModal(null)}
    >
      <form className="entity-form" onSubmit={submit}>
        {modal === "patient" && <>
          <label className="full"><span>نام و نام خانوادگی</span><input name="name" required placeholder="مثلاً آرش محمدی" /></label>
          <label><span>کد ملی</span><input name="nationalId" required inputMode="numeric" pattern="[0-9]{10}" maxLength={10} placeholder="۱۰ رقم بدون خط تیره" dir="ltr" /></label>
          <label><span>شماره موبایل</span><input name="phone" required inputMode="tel" placeholder="09xxxxxxxxx" dir="ltr" /></label>
          <label><span>تاریخ تولد</span><input name="birthDate" type="date" /></label>
          <label><span>شهر</span><input name="city" placeholder="کرج" /></label>
          <label><span>خدمت درخواستی</span><select name="service"><option value="">انتخاب خدمت...</option>{activeServices.map((item)=><option key={item.id} value={item.title}>{item.nationalCode} · {item.title}</option>)}</select></label>
          <label><span>پزشک</span><select name="doctor"><option value="">بعداً تعیین شود</option>{staff.filter((item)=>item.role==="پزشک").map((item)=><option key={item.id}>{item.name}</option>)}</select></label>
        </>}
        {modal === "appointment" && <>
          <label className="full"><span>بیمار</span><select name="patientId" required><option value="">انتخاب بیمار...</option>{patients.map((item)=><option key={item.id} value={item.id}>{item.name} · {item.nationalId}</option>)}</select></label>
          <label><span>تاریخ</span><input name="date" required type="date" /></label><label><span>ساعت</span><input name="time" required type="time" /></label>
          <label><span>پزشک</span><select name="doctor" required>{staff.filter((item)=>item.role==="پزشک").map((item)=><option key={item.id}>{item.name}</option>)}</select></label><label><span>نوع خدمت</span><select name="service" required><option value="">انتخاب خدمت...</option>{activeServices.map((item)=><option key={item.id} value={item.title}>{item.nationalCode} · {item.title}</option>)}</select></label>
          <label><span>اتاق</span><input name="room" placeholder="مثلاً اتاق ۲" /></label>
          <label className="full"><span>توضیح پذیرش</span><textarea name="notes" placeholder="اطلاعات تکمیلی نوبت..." /></label>
        </>}
        {modal === "lead" && <>
          <label className="full"><span>نام بیمار / مخاطب</span><input name="name" required /></label><label><span>شماره موبایل</span><input name="phone" required dir="ltr" /></label><label><span>منبع آشنایی</span><select name="source"><option>تماس مستقیم</option><option>اینستاگرام</option><option>وب‌سایت</option><option>همکار پزشک</option><option>معرفی بیمار</option></select></label><label><span>خدمت مورد نظر</span><input name="service" placeholder="مثلاً PRP زانو" /></label><label><span>ارزش احتمالی (تومان)</span><input name="value" inputMode="numeric" dir="ltr" placeholder="0" /></label><label className="full"><span>یادداشت اولیه</span><textarea name="notes" placeholder="شرح مختصر تماس..." /></label>
        </>}
        {modal === "staff" && <>
          <label className="full"><span>نام و نام خانوادگی</span><input name="name" required /></label><label><span>نوع همکاری</span><select name="personnelType"><option>داخلی</option><option>بیرونی</option></select></label><label><span>نقش سازمانی</span><select name="role"><option>پزشک</option><option>پذیرش</option><option>حسابداری</option><option>داروخانه</option><option>همکار ارجاع‌دهنده</option></select></label><label><span>تخصص / سمت</span><input name="specialty" /></label><label><span>شماره تماس</span><input name="phone" dir="ltr" /></label><label><span>الگوی شیفت</span><input name="shift" placeholder="مثلاً روزهای زوج" /></label><label><span>درصد سهم</span><input name="revenueShare" inputMode="numeric" placeholder="۰" /></label>
        </>}
        {modal === "referral" && <>
          <label className="full important-field"><span>کد ملی بیمار</span><input name="nationalId" required inputMode="numeric" pattern="[0-9]{10}" maxLength={10} placeholder="۱۰ رقم بدون خط تیره" dir="ltr" autoFocus /></label>
          {role === "همکار بیرونی" ? <><input type="hidden" name="colleagueName" value={currentColleagueName ?? ""}/><div className="form-note full"><Icon name="share" size={17}/><span>ارجاع به نام {currentColleagueName || "حساب همکار متصل"} ثبت می‌شود.</span></div></> : <label className="full"><span>همکار ارجاع‌دهنده</span><select name="colleagueName">{staff.filter((member)=>member.personnelType==="بیرونی").map((member)=><option key={member.id}>{member.name}</option>)}</select></label>}
          <label className="full"><span>خدمت پیشنهادی (اختیاری)</span><select name="serviceId"><option value="">بعداً توسط پذیرش تعیین شود</option>{activeServices.map((item)=><option key={item.id} value={item.id}>{item.nationalCode} · {item.title}</option>)}</select></label>
          <div className="form-note full"><Icon name="check" size={17}/><span>پس از ثبت، پذیرش کلینیک پرونده را تکمیل می‌کند و وضعیت ارجاع برای همکار قابل مشاهده خواهد بود.</span></div>
        </>}
        {modal === "medication" && <>
          <label><span>نام قلم</span><input name="name" required /></label><label><span>نام ژنریک</span><input name="genericName" dir="ltr" /></label><label><span>دسته‌بندی</span><input name="category" placeholder="دارو، مصرفی، کیت..." /></label><label><span>تعداد موجودی</span><input name="stock" required inputMode="numeric" /></label><label><span>نقطه سفارش</span><input name="minStock" inputMode="numeric" defaultValue="5" /></label><label><span>واحد</span><select name="unit"><option>عدد</option><option>ویال</option><option>کپسول</option><option>بسته</option><option>کیت</option></select></label><label><span>قیمت واحد</span><input name="unitPrice" inputMode="numeric" dir="ltr" /></label><label><span>شماره بچ</span><input name="batch" dir="ltr" /></label><label><span>تاریخ انقضا</span><input name="expiresAt" placeholder="۱۴۰۶/۰۶/۳۱" /></label><label><span>تأمین‌کننده</span><input name="supplier" /></label>
        </>}
        {modal === "sale" && <>
          <label className="full"><span>دارو / کالا</span><select name="medicationId">{medications.map((item)=><option key={item.id} value={item.id}>{item.name} · موجودی {fa(item.stock)} {item.unit}</option>)}</select></label><label><span>تعداد</span><input name="count" required inputMode="numeric" defaultValue="1" /></label><label><span>بیمار / خریدار</span><input name="buyer" placeholder="نام بیمار" /></label><label className="full"><span>روش پرداخت</span><select name="paymentMethod"><option>کارتخوان</option><option>نقدی</option><option>انتقال بانکی</option></select></label>
        </>}
        {(modal === "income" || modal === "expense") && <>
          <label className="full"><span>بیمار / طرف حساب</span><input name="counterparty" required placeholder={modal === "expense" ? "نام فروشنده یا دریافت‌کننده" : "نام بیمار یا پرداخت‌کننده"} /></label>
          <label className="full"><span>شرح</span><input name="description" required placeholder={modal === "expense" ? "شرح هزینه" : "شرح خدمت یا دریافت"} /></label>
          <label><span>مبلغ (تومان)</span><input name="amount" required inputMode="numeric" dir="ltr" /></label>
          <label><span>روش پرداخت</span><select name="paymentMethod"><option>کارتخوان</option><option>نقدی</option><option>انتقال بانکی</option><option>چک</option></select></label>
          <label className="full"><span>وضعیت</span><select name="status"><option value="paid">پرداخت‌شده</option><option value="partial">پرداخت بخشی</option><option value="pending">در انتظار</option></select></label>
        </>}
        {modal === "visit" && selectedPatient && <>
          <div className="form-note full"><Icon name="users" size={17}/><span>ثبت برای پرونده {selectedPatient.name} · {selectedPatient.nationalId}</span></div>
          <label className="full"><span>پزشک</span><input name="doctor" required placeholder="نام پزشک معالج" /></label>
          <label className="full"><span>شکایت اصلی</span><textarea name="chiefComplaint" placeholder="شرح شکایت و علت مراجعه" /></label>
          <label className="full"><span>تشخیص</span><textarea name="diagnosis" placeholder="تشخیص یا ارزیابی بالینی" /></label>
          <label className="full"><span>اقدام و برنامه درمانی</span><textarea name="treatment" placeholder="خدمت، پروسیجر یا توصیه درمانی" /></label>
          <label className="full"><span>داروها</span><textarea name="medications" placeholder="نام و دستور مصرف داروها" /></label>
          <label><span>تاریخ پیگیری</span><input name="followUpAt" type="date" /></label>
        </>}
        <footer className="form-actions"><button type="button" className="secondary-button" onClick={()=>setModal(null)}>انصراف</button><button className="primary-button" disabled={busy}>{busy ? "در حال ثبت..." : "ثبت و ادامه"}</button></footer>
      </form>
    </Modal>
  ) : null;

  if (active === "services") {
    return <ServicesView role={role} services={services} shares={serviceShares} settings={tariffSettings} staff={staff} consumables={medications} reloadData={reloadData} showToast={showToast} />;
  }

  if (active === "users") {
    return <AccessView users={users} staff={staff} patients={patients} currentEmail={currentEmail} reloadData={reloadData} showToast={showToast} />;
  }

  if (active === "patients") {
    return (
      <>
        <ModuleHeader eyebrow="پرونده الکترونیک" title="مدیریت بیماران" description="مشاهده پرونده، سوابق درمان، پرداخت‌ها و پیگیری‌های هر بیمار" action="پذیرش بیمار جدید" onAction={() => setModal("patient")} secondaryAction="خروجی بیماران" onSecondary={() => showToast("گزارش بیماران برای خروجی آماده شد")} />
        <section className="metrics-row four">
          <MetricCard label="کل بیماران" value={fa(patients.length)} detail="پرونده ثبت‌شده" tone="cyan" icon="users" />
          <MetricCard label="بیماران فعال" value={fa(patients.filter((item)=>item.status==="فعال").length)} detail="در چرخه درمان" tone="purple" icon="plus" />
          <MetricCard label="در حال درمان" value={fa(patients.filter((item)=>item.status==="در حال درمان").length)} detail="نیازمند پیگیری" tone="amber" icon="clock" />
          <MetricCard label="مطالبات بیماران" value={`${toman(patients.reduce((sum,item)=>sum+item.balance,0))} ت`} detail="مانده حساب ثبت‌شده" tone="green" icon="wallet" />
        </section>
        <section className="panel data-panel">
          <div className="data-toolbar">
            <div className="inline-search"><Icon name="search" size={18}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="نام، کد ملی یا شماره موبایل..." /></div>
            <div className="filter-tabs">{["همه", "فعال", "در حال درمان", "در انتظار", "تکمیل درمان"].map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div>
          </div>
          <div className="table-scroll">
            <table className="data-table"><thead><tr><th>بیمار</th><th>کد ملی / تماس</th><th>خدمت آخر</th><th>پزشک</th><th>وضعیت</th><th>مانده حساب</th><th></th></tr></thead>
              <tbody>{filteredPatients.map((patient) => <tr key={patient.id} onClick={() => setSelectedPatient(patient)}><td><div className="identity"><span className="patient-avatar cyan">{patient.name.slice(0, 2)}</span><div><strong>{patient.name}</strong><small>{patient.id} · {patient.age} سال</small></div></div></td><td><strong className="mono">{patient.nationalId}</strong><small>{patient.phone}</small></td><td><strong>{patient.service}</strong><small>{patient.lastVisit}</small></td><td>{patient.doctor}</td><td><span className={`status ${patient.status === "در انتظار" ? "amber" : patient.status === "تکمیل درمان" ? "purple" : "green"}`}><i/>{patient.status}</span></td><td className={patient.balance ? "amount-due" : "amount-ok"}>{patient.balance ? `${toman(patient.balance)} ت` : "تسویه"}</td><td><button className="table-more"><Icon name="more" size={18}/></button></td></tr>)}</tbody>
            </table>
          </div>
          <div className="table-footer"><span>نمایش {fa(filteredPatients.length)} پرونده از {fa(patients.length)} بیمار</span></div>
        </section>
        {selectedPatient && <div className="drawer-backdrop" onMouseDown={()=>setSelectedPatient(null)}><aside className="patient-drawer" onMouseDown={(event)=>event.stopPropagation()}><header><button onClick={()=>setSelectedPatient(null)}>×</button><span className="patient-avatar cyan">{selectedPatient.name.slice(0,2)}</span><div><small>پرونده {selectedPatient.id}</small><h2>{selectedPatient.name}</h2><p>{selectedPatient.phone} · {selectedPatient.age} سال</p></div></header><div className="drawer-tags">{selectedPatient.tags.map((tag)=><span key={tag}>{tag}</span>)}</div><section className="patient-summary"><div><small>کد ملی</small><strong className="mono">{selectedPatient.nationalId}</strong></div><div><small>پزشک مسئول</small><strong>{selectedPatient.doctor}</strong></div><div><small>وضعیت پرونده</small><strong>{selectedPatient.status}</strong></div><div><small>مانده حساب</small><strong className={selectedPatient.balance?"amount-due":"amount-ok"}>{selectedPatient.balance?`${toman(selectedPatient.balance)} تومان`:"تسویه"}</strong></div></section><section className="drawer-history patient-timeline"><h3>تایملاین پرونده بیمار</h3>{selectedPatientTimeline.length?selectedPatientTimeline.map((event)=><div key={`${event.kind}-${event.id}`} className={`timeline-${event.kind}`}><i/><span><em>{event.kind === "visit" ? "درمان" : event.kind === "appointment" ? "نوبت" : event.kind === "payment" ? "مالی" : "پرونده"}</em><strong>{event.title}</strong><small>{event.meta} · {new Date(event.at).toLocaleDateString("fa-IR")}</small>{event.detail&&<small>{event.detail}</small>}</span></div>):<div><i className="muted"/><span><strong>هنوز رویدادی ثبت نشده است</strong><small>نوبت، ویزیت و پرداخت‌ها خودکار در این تایملاین قرار می‌گیرند.</small></span></div>}</section><footer><button className="secondary-button" onClick={()=>showToast("صورتحساب بیمار باز شد")}>صورتحساب</button>{["مدیر سیستم","پزشک"].includes(role)&&<button className="primary-button" onClick={()=>setModal("visit")}>ثبت یادداشت درمانی</button>}</footer></aside></div>}
        {modalLayer}
      </>
    );
  }

  if (active === "appointments") {
    const appointmentStatus: Record<AppointmentRecord["status"], { label: string; tone: string }> = {
      scheduled: { label: "رزرو شده", tone: "purple" }, arrived: { label: "پذیرش شد", tone: "green" },
      in_progress: { label: "در حال ویزیت", tone: "cyan" }, completed: { label: "تکمیل شد", tone: "green" },
      cancelled: { label: "لغو شده", tone: "amber" },
    };
    const activeAppointments = appointmentRecords.filter((item)=>item.status!=="cancelled");
    return (
      <>
        <ModuleHeader eyebrow="تقویم و جریان پذیرش" title="نوبت‌ها و پذیرش" description="مدیریت برنامه پزشکان، اتاق‌ها و وضعیت مراجعین در لحظه" action="رزرو نوبت جدید" onAction={() => setModal("appointment")} secondaryAction="نمای تقویم" onSecondary={() => showToast("نمای تقویم هفتگی فعال است")} />
        <section className="metrics-row four"><MetricCard label="کل نوبت‌ها" value={fa(appointmentRecords.length)} detail="ثبت‌شده در سامانه" tone="cyan" icon="calendar"/><MetricCard label="در انتظار مراجعه" value={fa(appointmentRecords.filter((item)=>item.status==="scheduled").length)} detail="رزرو قطعی" tone="purple" icon="clock"/><MetricCard label="پذیرش‌شده" value={fa(appointmentRecords.filter((item)=>item.status==="arrived").length)} detail="آماده ورود به پزشک" tone="green" icon="check"/><MetricCard label="لغوشده" value={fa(appointmentRecords.filter((item)=>item.status==="cancelled").length)} detail="قابل رزرو مجدد" tone="amber" icon="warning"/></section>
        <section className="schedule-layout">
          <article className="panel schedule-panel"><div className="panel-head"><div><span className="panel-kicker">برنامه ثبت‌شده</span><h2>نوبت‌های کلینیک</h2></div><span className="status green"><i/>{fa(activeAppointments.length)} نوبت فعال</span></div>
            <div className="schedule-list">{appointmentRecords.length ? appointmentRecords.map((item) => { const state=appointmentStatus[item.status]; return <div className="schedule-item" key={item.id}><time>{item.time}</time><div className={`schedule-line ${state.tone}`}/><span className={`patient-avatar ${state.tone}`}>{item.patientName.slice(0,2)}</span><div><strong>{item.patientName}</strong><small>{item.date} · {item.service} · {item.doctor}{item.room?` · ${item.room}`:""}</small></div><button className={`status ${state.tone}`} onClick={async()=>{const next=item.status==="scheduled"?"arrived":item.status==="arrived"?"in_progress":item.status==="in_progress"?"completed":"scheduled";await persistUpdate("appointment",item.id,{status:next});await reloadData();showToast("وضعیت نوبت به‌روزرسانی شد")}}><i/>{state.label}</button><button><Icon name="more" size={18}/></button></div>}) : <div className="empty-state"><Icon name="calendar" size={28}/><strong>هنوز نوبتی ثبت نشده است</strong><small>از دکمه «رزرو نوبت جدید» شروع کنید.</small></div>}</div>
          </article>
          <aside className="schedule-side"><article className="panel"><div className="panel-head"><div><span className="panel-kicker">وضعیت عملیاتی</span><h2>تفکیک خدمات</h2></div></div><div className="room-list">{Array.from(new Set(activeAppointments.map((item)=>item.service))).slice(0,4).map((service,index)=><div key={service}><span className="room-number">{fa(index+1)}</span><p><strong>{service}</strong><small>{fa(activeAppointments.filter((item)=>item.service===service).length)} نوبت فعال</small></p><em className="ready">فعال</em></div>)}</div></article><article className="panel mini-alert"><span><Icon name="clock"/></span><div><strong>اطلاعات به‌صورت زنده ذخیره می‌شود</strong><small>تغییر وضعیت هر نوبت در تاریخچه ثبت خواهد شد.</small></div></article></aside>
        </section>
        {modalLayer}
      </>
    );
  }

  if (active === "crm") {
    const columns: { key: Lead["stage"]; label: string; tone: string }[] = [{key:"new",label:"سرنخ جدید",tone:"cyan"},{key:"contacted",label:"تماس گرفته شد",tone:"green"},{key:"booked",label:"نوبت رزرو شد",tone:"purple"},{key:"treated",label:"درمان و پیگیری",tone:"pink"}];
    return (
      <>
        <ModuleHeader eyebrow="مدیریت ارتباط با بیمار" title="CRM کلینیک" description="از اولین تماس تا رزرو، درمان و پیگیری رضایت بیمار" action="افزودن سرنخ" onAction={() => setModal("lead")} secondaryAction="کمپین پیامکی" onSecondary={() => showToast("صفحه طراحی کمپین باز شد")} />
        <section className="metrics-row four"><MetricCard label="فرصت‌های باز" value={fa(leads.filter((item)=>item.stage!=="treated").length)} detail={`ارزش ${toman(leads.filter((item)=>item.stage!=="treated").reduce((sum,item)=>sum+item.value,0))} تومان`} tone="cyan" icon="pulse"/><MetricCard label="سرنخ جدید" value={fa(leads.filter((item)=>item.stage==="new").length)} detail="نیازمند تماس اولیه" tone="amber" icon="clock"/><MetricCard label="نرخ تبدیل" value={`${fa(leads.length?Math.round(leads.filter((item)=>item.stage==="treated").length/leads.length*100):0)}٪`} detail="بر اساس داده ثبت‌شده" tone="green" icon="chart"/><MetricCard label="درمان‌شده" value={fa(leads.filter((item)=>item.stage==="treated").length)} detail="تکمیل چرخه CRM" tone="purple" icon="check"/></section>
        <section className="crm-toolbar"><div className="inline-search"><Icon name="search" size={18}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="جستجو در سرنخ‌ها..."/></div><div className="crm-filter"><button className="active">همه کارشناسان</button><button>پیگیری امروز</button><button>عقب‌افتاده</button></div></section>
        <section className="kanban">{columns.map((column) => { const items = leads.filter((lead) => lead.stage === column.key && (!normalized || lead.name.includes(normalized))); return <article className="kanban-column" key={column.key}><header><div><i className={column.tone}/><strong>{column.label}</strong><span>{fa(items.length)}</span></div><small>{toman(items.reduce((sum,item)=>sum+item.value,0))} تومان</small></header><div className="kanban-cards">{items.map((lead) => <div className="lead-card" key={lead.id}><div className="lead-top"><span className={`patient-avatar ${column.tone === "pink" ? "purple" : column.tone}`}>{lead.name.slice(0,2)}</span><div><strong>{lead.name}</strong><small>{lead.phone}</small></div><button><Icon name="more" size={17}/></button></div><div className="lead-service"><span>{lead.service}</span><strong>{toman(lead.value)} ت</strong></div><p><Icon name="clock" size={14}/>{lead.nextAction}</p><footer><span>{lead.source}</span><div><button disabled={column.key === "new"} onClick={()=>moveLead(lead,-1)}>→</button><button disabled={column.key === "treated"} onClick={()=>moveLead(lead,1)}>←</button></div></footer></div>)}</div><button className="kanban-add" onClick={()=>setModal("lead")}><Icon name="plus" size={15}/> افزودن کارت</button></article>; })}</section>
        {modalLayer}
      </>
    );
  }

  if (active === "personnel") {
    return (
      <>
        <ModuleHeader eyebrow="منابع انسانی و همکاری‌ها" title="پرسنل و شیفت‌ها" description="مدیریت کارکنان داخلی، پزشکان، همکاران بیرونی و قراردادهای همکاری" action="ثبت همکار جدید" onAction={() => setModal("staff")} secondaryAction="برنامه شیفت" onSecondary={() => showToast("برنامه هفتگی شیفت‌ها آماده است")} />
        <section className="metrics-row four"><MetricCard label="پرسنل داخلی" value={fa(staff.filter((item)=>item.personnelType==="داخلی").length)} detail="همکار ثبت‌شده" tone="cyan" icon="briefcase"/><MetricCard label="پزشکان فعال" value={fa(staff.filter((item)=>item.role==="پزشک"&&item.status!=="inactive").length)} detail="قابل انتخاب در نوبت" tone="purple" icon="users"/><MetricCard label="همکاران بیرونی" value={fa(staff.filter((item)=>item.personnelType==="بیرونی").length)} detail={`${fa(referrals.reduce((sum,item)=>sum+item.referrals,0))} ارجاع ثبت‌شده`} tone="green" icon="share"/><MetricCard label="غیرفعال / مرخصی" value={fa(staff.filter((item)=>item.status==="مرخصی"||item.status==="inactive").length)} detail="نیازمند بررسی مدیر" tone="amber" icon="calendar"/></section>
        <section className="panel data-panel"><div className="data-toolbar"><div className="inline-search"><Icon name="search" size={18}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="نام، سمت یا تخصص..."/></div><div className="filter-tabs">{["همه","داخلی","بیرونی"].map((item)=><button key={item} className={filter===item?"active":""} onClick={()=>setFilter(item)}>{item === "همه" ? "همه همکاران" : `پرسنل ${item}`}</button>)}</div></div><div className="staff-grid">{filteredStaff.map((member)=><article className="staff-card" key={member.id}><div className="staff-main"><span className={`staff-avatar ${member.tone}`}>{member.initials}</span><div><strong>{member.name}</strong><small>{member.specialty}</small></div><span className={`type-badge ${member.personnelType === "داخلی" ? "internal" : "external"}`}>{member.personnelType}</span></div><dl><div><dt>سمت</dt><dd>{member.role}</dd></div><div><dt>شیفت / نوع همکاری</dt><dd>{member.shift}</dd></div><div><dt>سهم همکاری</dt><dd>{member.revenueShare ? `${fa(member.revenueShare)}٪` : "حقوق ثابت"}</dd></div></dl><footer><span className={`status ${member.status === "مرخصی" ? "amber":"green"}`}><i/>{member.status}</span><button onClick={()=>showToast(`پروفایل ${member.name} باز شد`)}>مشاهده پروفایل <Icon name="arrow" size={15}/></button></footer></article>)}</div></section>
        {modalLayer}
      </>
    );
  }

  if (active === "referrals") {
    const visibleReferrals = referrals;
    const referralCount = visibleReferrals.reduce((sum,item)=>sum+item.referrals,0);
    const referralConverted = visibleReferrals.reduce((sum,item)=>sum+item.converted,0);
    const referralMax = Math.max(1,...visibleReferrals.map((item)=>item.referrals));
    return (
      <>
        <ModuleHeader eyebrow="شبکه ارجاع کلینیک" title="همکاران و ارجاعات" description={role === "همکار بیرونی" ? "مشاهده ارجاعات و سهم همکاری شما" : "ثبت ارجاع، اندازه‌گیری نرخ تبدیل و محاسبه سهم همکاران بیرونی"} action="ثبت ارجاع جدید" onAction={() => setModal("referral")} secondaryAction="تسویه همکاران" onSecondary={() => showToast("۶ تسویه در انتظار تأیید است")} />
        <section className="metrics-row four"><MetricCard label="کل ارجاعات" value={fa(referralCount)} detail="بر اساس رکوردهای ثبت‌شده" tone="cyan" icon="share"/><MetricCard label="تبدیل به درمان" value={`${fa(referralCount?Math.round(referralConverted/referralCount*100):0)}٪`} detail={`${fa(referralConverted)} بیمار درمان‌شده`} tone="green" icon="check"/><MetricCard label="ارزش خدمات" value={`${toman(visibleReferrals.reduce((sum,item)=>sum+item.amount,0))} ت`} detail="ارجاعات تبدیل‌شده" tone="purple" icon="wallet"/><MetricCard label="سهم قابل تسویه" value={`${toman(visibleReferrals.reduce((sum,item)=>sum+item.due,0))} ت`} detail={`برای ${fa(visibleReferrals.length)} همکار`} tone="amber" icon="clock"/></section>
        <section className="panel referral-panel"><div className="panel-head"><div><span className="panel-kicker">رتبه‌بندی ماه جاری</span><h2>{role === "همکار بیرونی" ? "عملکرد ارجاعات من" : "عملکرد همکاران ارجاع‌دهنده"}</h2></div><button className="text-button" onClick={()=>showToast("گزارش کامل ارجاعات آماده شد")}>گزارش کامل <Icon name="arrow" size={15}/></button></div><div className="table-scroll"><table className="data-table"><thead><tr><th>همکار</th><th>تخصص</th><th>تعداد ارجاع</th><th>درمان‌شده</th><th>نرخ تبدیل</th><th>ارزش خدمات</th><th>سهم قابل تسویه</th><th>آخرین ارجاع</th></tr></thead><tbody>{visibleReferrals.map((item)=><tr key={item.id}><td><div className="identity"><span className={`patient-avatar ${item.tone}`}>{item.colleague.slice(0,2)}</span><strong>{item.colleague}</strong></div></td><td>{item.specialty}</td><td><strong>{fa(item.referrals)}</strong></td><td>{fa(item.converted)}</td><td><div className="conversion"><span><i style={{width:`${Math.round(item.converted/item.referrals*100)}%`}}/></span><strong>{fa(Math.round(item.converted/item.referrals*100))}٪</strong></div></td><td>{toman(item.amount)} ت</td><td className="amount-due">{toman(item.due)} ت</td><td><small>{item.lastReferral}</small></td></tr>)}</tbody></table></div></section>
        <section className="referral-bottom"><article className="panel"><div className="panel-head"><div><span className="panel-kicker">منابع ارجاع</span><h2>ترکیب شبکه همکاری</h2></div></div><div className="source-bars">{visibleReferrals.length?visibleReferrals.slice(0,5).map((item)=><div key={item.id}><span>{item.colleague}</span><i><b style={{width:`${item.referrals/referralMax*100}%`}}/></i><strong>{fa(item.referrals)}</strong></div>):<div className="empty-state"><strong>هنوز ارجاعی ثبت نشده است</strong></div>}</div></article><article className="panel referral-cta"><span><Icon name="share" size={28}/></span><div><small>گردش ارجاع همکاران</small><strong>ثبت ارجاع فقط با کد ملی بیمار</strong><p>همکار بیرونی پس از ورود، فقط ارجاعات و سهم خودش را مشاهده می‌کند.</p></div></article></section>
        {modalLayer}
      </>
    );
  }

  if (active === "pharmacy") {
    const lowStock = medications.filter((item)=>item.stock <= item.minStock);
    const inventoryValue = medications.reduce((sum,item)=>sum+item.stock*item.unitPrice,0);
    const pharmacyRevenue = transactions.filter((item)=>item.category==="pharmacy"&&item.status==="paid").reduce((sum,item)=>sum+item.amount,0);
    return (
      <>
        <ModuleHeader eyebrow="موجودی و فروش" title="داروخانه کلینیک" description="کنترل موجودی، تاریخ انقضا، خرید از تأمین‌کننده و فروش به بیمار" action="ثبت فروش" onAction={() => setModal("sale")} secondaryAction="افزودن قلم دارویی" onSecondary={() => setModal("medication")} />
        <section className="metrics-row four"><MetricCard label="ارزش موجودی" value={`${toman(inventoryValue)} ت`} detail="بر اساس قیمت واحد" tone="cyan" icon="wallet"/><MetricCard label="فروش ثبت‌شده" value={`${toman(pharmacyRevenue)} ت`} detail={`از ${fa(transactions.filter((item)=>item.category==="pharmacy").length)} تراکنش`} tone="green" icon="chart"/><MetricCard label="زیر نقطه سفارش" value={fa(lowStock.length)} detail="نیازمند ثبت سفارش" tone="amber" icon="warning"/><MetricCard label="دارای تاریخ انقضا" value={fa(medications.filter((item)=>item.expiresAt&&item.expiresAt!=="—").length)} detail="قابل پایش در موجودی" tone="purple" icon="clock"/></section>
        {lowStock.length > 0 && <section className="inventory-alert"><span><Icon name="warning"/></span><div><strong>{fa(lowStock.length)} قلم زیر نقطه سفارش است</strong><small>{lowStock.map((item)=>item.name).join("، ")}</small></div><button onClick={()=>showToast("پیش‌نویس سفارش خرید ساخته شد")}>ساخت سفارش خرید</button></section>}
        <section className="panel data-panel"><div className="data-toolbar"><div className="inline-search"><Icon name="search" size={18}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="نام دارو، نام ژنریک، دسته یا بچ..."/></div><div className="filter-tabs"><button className="active">همه اقلام</button><button>کم‌موجود</button><button>نزدیک انقضا</button></div></div><div className="table-scroll"><table className="data-table pharmacy-table"><thead><tr><th>نام قلم</th><th>دسته</th><th>موجودی</th><th>نقطه سفارش</th><th>قیمت واحد</th><th>بچ / انقضا</th><th>تأمین‌کننده</th><th></th></tr></thead><tbody>{filteredMedications.map((item)=>{const low=item.stock<=item.minStock;return <tr key={item.id}><td><div className="identity"><span className={`medicine-icon ${low?"low":""}`}><Icon name="pill" size={18}/></span><div><strong>{item.name}</strong><small dir="ltr">{item.genericName}</small></div></div></td><td>{item.category}</td><td><div className={`stock-value ${low?"low":""}`}><strong>{fa(item.stock)} {item.unit}</strong><span><i style={{width:`${Math.min(100,item.stock/Math.max(item.minStock*2,1)*100)}%`}}/></span></div></td><td>{fa(item.minStock)} {item.unit}</td><td>{fa(item.unitPrice)} ت</td><td><strong className="mono">{item.batch}</strong><small>{item.expiresAt}</small></td><td>{item.supplier}</td><td><button className="table-more"><Icon name="more" size={18}/></button></td></tr>})}</tbody></table></div></section>
        {modalLayer}
      </>
    );
  }

  if (active === "finance") {
    const income = transactions.filter((item)=>item.category!=="expense"&&item.status==="paid").reduce((sum,item)=>sum+item.amount,0);
    const expenses = transactions.filter((item)=>item.category==="expense"&&item.status==="paid").reduce((sum,item)=>sum+item.amount,0);
    const receivables = transactions.filter((item)=>item.status!=="paid").reduce((sum,item)=>sum+item.amount,0);
    const categoryData = [
      {d:"درمان",amount:transactions.filter((item)=>item.category==="service"&&item.status==="paid").reduce((s,i)=>s+i.amount,0),c:"cyan"},
      {d:"دارو",amount:transactions.filter((item)=>item.category==="pharmacy"&&item.status==="paid").reduce((s,i)=>s+i.amount,0),c:"purple"},
      {d:"هزینه",amount:expenses,c:"amber"},
    ];
    const maxCategory = Math.max(1,...categoryData.map((item)=>item.amount));
    return (
      <>
        <ModuleHeader eyebrow="حسابداری یکپارچه" title="مالی و تسویه" description="درآمد، هزینه، مطالبات، سهم پزشکان و تسویه همکاران" action="ثبت دریافت" onAction={()=>setModal("income")} secondaryAction="ثبت هزینه" onSecondary={()=>setModal("expense")} />
        <section className="metrics-row four"><MetricCard label="دریافتی ثبت‌شده" value={`${toman(income)} ت`} detail="تراکنش‌های پرداخت‌شده" tone="cyan" icon="wallet"/><MetricCard label="خالص دریافتی" value={`${toman(income-expenses)} ت`} detail="پس از کسر هزینه‌ها" tone="green" icon="chart"/><MetricCard label="مطالبات باز" value={`${toman(receivables)} ت`} detail={`${fa(transactions.filter((item)=>item.status!=="paid").length)} تراکنش باز`} tone="amber" icon="clock"/><MetricCard label="هزینه ثبت‌شده" value={`${toman(expenses)} ت`} detail="پرداخت‌های قطعی" tone="purple" icon="share"/></section>
        <section className="finance-layout"><article className="panel revenue-panel"><div className="panel-head"><div><span className="panel-kicker">ترکیب گردش مالی</span><h2>مقایسه دسته‌ها</h2></div></div><div className="bar-chart">{categoryData.map((bar)=><div key={bar.d}><span className="bar-value">{toman(bar.amount)}</span><i><b className={bar.c} style={{height:`${Math.max(3,bar.amount/maxCategory*100)}%`}}/></i><small>{bar.d}</small></div>)}</div></article><article className="panel settlement-panel"><div className="panel-head"><div><span className="panel-kicker">جمع‌بندی واقعی</span><h2>وضعیت ثبت حساب‌ها</h2></div></div><div className="settlement-list"><div><span className="patient-avatar cyan">ت</span><p><strong>{fa(transactions.length)} تراکنش</strong><small>کل گردش‌های ثبت‌شده</small></p><b>{toman(income+expenses)}</b></div><div><span className="patient-avatar amber">ب</span><p><strong>{fa(transactions.filter((item)=>item.status!=="paid").length)} مورد باز</strong><small>در انتظار وصول یا تکمیل</small></p><b>{toman(receivables)}</b></div></div></article></section>
        <section className="panel data-panel"><div className="panel-head"><div><span className="panel-kicker">آخرین گردش مالی</span><h2>تراکنش‌های ثبت‌شده</h2></div></div><div className="table-scroll"><table className="data-table"><thead><tr><th>شماره</th><th>بیمار / طرف حساب</th><th>شرح</th><th>مبلغ</th><th>روش پرداخت</th><th>وضعیت</th><th>زمان ثبت</th></tr></thead><tbody>{transactions.map((item)=><tr key={item.id}><td className="mono">{item.id}</td><td><strong>{item.counterparty}</strong></td><td>{item.description}</td><td><strong className={item.category==="expense"?"amount-due":"amount-ok"}>{item.category==="expense"?"−":"+"}{toman(item.amount)} ت</strong></td><td>{item.paymentMethod||"—"}</td><td><span className={`status ${item.status==="paid"?"green":item.status==="pending"?"amber":"purple"}`}><i/>{item.status==="paid"?"پرداخت شد":item.status==="pending"?"در انتظار":"پرداخت بخشی"}</span></td><td><small>{new Date(item.createdAt).toLocaleDateString("fa-IR")}</small></td></tr>)}</tbody></table></div></section>
        {modalLayer}
      </>
    );
  }

  return (
    <>
      <ModuleHeader eyebrow="هوش مدیریتی" title="گزارش‌ها و تحلیل‌ها" description="نمای یکپارچه شاخص‌های درمانی، عملیاتی، مالی و رضایت بیماران" action="ساخت گزارش سفارشی" onAction={()=>showToast("گزارش‌ساز آماده استفاده است")} secondaryAction="خروجی PDF" onSecondary={()=>showToast("خروجی گزارش در حال آماده‌سازی است")} />
      <section className="metrics-row four"><MetricCard label="کل بیماران" value={fa(patients.length)} detail="پرونده‌های ثبت‌شده" tone="cyan" icon="users"/><MetricCard label="درمان تکمیل‌شده" value={fa(completedAppointments)} detail={`${fa(appointmentRecords.length)} نوبت کل`} tone="green" icon="check"/><MetricCard label="درآمد ثبت‌شده" value={`${toman(reportIncome)} ت`} detail="دریافتی قطعی" tone="purple" icon="wallet"/><MetricCard label="نرخ تبدیل CRM" value={`${fa(leads.length?Math.round(leads.filter((item)=>item.stage==="treated").length/leads.length*100):0)}٪`} detail="بر اساس سرنخ‌ها" tone="amber" icon="chart"/></section>
      <section className="report-grid"><article className="panel report-hero"><div className="panel-head"><div><span className="panel-kicker">داده عملیاتی</span><h2>توزیع خدمات ثبت‌شده</h2></div></div><div className="service-bars">{serviceStats.length?serviceStats.map(([name,count],index)=><div key={name}><span>{name}</span><i><b className={["cyan","purple","green","amber"][index%4]} style={{width:`${count/maxService*100}%`}}/></i><strong>{fa(count)} نوبت</strong></div>):<div className="empty-state"><strong>هنوز داده کافی برای نمودار وجود ندارد</strong></div>}</div></article><article className="panel report-list"><div className="panel-head"><div><span className="panel-kicker">گزارش‌های زنده</span><h2>خلاصه سامانه</h2></div></div>{[{t:"عملکرد پزشکان",d:`${fa(staff.filter((item)=>item.role==="پزشک").length)} پزشک ثبت‌شده`,i:"users" as IconName,c:"cyan"},{t:"کنترل موجودی",d:`${fa(medications.filter((item)=>item.stock<=item.minStock).length)} قلم کم‌موجود`,i:"pill" as IconName,c:"green"},{t:"شبکه ارجاع",d:`${fa(referrals.reduce((s,i)=>s+i.referrals,0))} ارجاع`,i:"share" as IconName,c:"amber"}].map((report)=><button key={report.t}><span className={report.c}><Icon name={report.i}/></span><p><strong>{report.t}</strong><small>{report.d}</small></p><Icon name="arrow" size={17}/></button>)}</article></section>
      <section className="service-performance"><article className="panel"><div className="panel-head"><div><span className="panel-kicker">سلامت داده</span><h2>پوشش ماژول‌ها</h2></div></div><div className="service-bars">{[{n:"پرونده بیماران",v:patients.length,x:`${fa(patients.length)} رکورد`},{n:"نوبت‌ها",v:appointmentRecords.length,x:`${fa(appointmentRecords.length)} رکورد`},{n:"تراکنش مالی",v:transactions.length,x:`${fa(transactions.length)} رکورد`},{n:"اقلام داروخانه",v:medications.length,x:`${fa(medications.length)} رکورد`}].map((item,index)=><div key={item.n}><span>{item.n}</span><i><b className={["cyan","purple","green","amber"][index]} style={{width:`${Math.min(100,Math.max(4,item.v*5))}%`}}/></i><strong>{item.x}</strong></div>)}</div></article><article className="panel insight-card"><span>وضعیت سامانه</span><h2>تمام شاخص‌های این صفحه از اطلاعات ثبت‌شده در پایگاه‌داده محاسبه می‌شوند.</h2><p>با ثبت بیمار، نوبت، فروش یا تراکنش جدید، گزارش‌ها پس از ذخیره به‌روز خواهند شد.</p></article></section>
      {modalLayer}
    </>
  );
}

export default function ClinicApp({ user }: { user: { displayName: string; email: string; role: string; colleagueName: string | null; patientId: string | null } }) {
  const [active, setActive] = useState<NavKey>("dashboard");
  const role = roles.includes(user.role) ? user.role : "پذیرش";
  const [searchOpen, setSearchOpen] = useState(false);
  const [taskDone, setTaskDone] = useState<number[]>([]);
  const [toast, setToast] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [appointmentRecords, setAppointmentRecords] = useState<AppointmentRecord[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [services, setServices] = useState<MedicalServiceRecord[]>([]);
  const [serviceShares, setServiceShares] = useState<ServiceShareRecord[]>([]);
  const [tariffSettings, setTariffSettings] = useState<TariffSettingsRecord | null>(null);
  const [users, setUsers] = useState<UserAccountRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [seedingDemo, setSeedingDemo] = useState(false);
  const [dataError, setDataError] = useState("");

  const visibleNavItems = useMemo(() => navItems.filter((item) => permissions[role].includes(item.key)), [role]);

  async function reloadData() {
    setDataError("");
    const response = await fetch("/api/clinic", { cache: "no-store" });
    const payload = await response.json() as Record<string, unknown> & { error?: string };
    if (!response.ok) { setDataError(payload.error || "دریافت اطلاعات ناموفق بود"); setLoading(false); return; }
    const patientRows = (payload.patients ?? []) as Array<Record<string, unknown>>;
    setPatients(patientRows.map((row): Patient => { const createdAt=String(row.createdAt); const status=String(row.status); return { id:String(row.id), nationalId:String(row.nationalId), name:String(row.name), phone:String(row.phone), age:"—", service:String(row.service??"—"), doctor:String(row.doctor??"تخصیص داده نشده"), lastVisit:new Date(createdAt).toLocaleDateString("fa-IR"), createdAt, status:status==="active"?"فعال":status==="treatment"?"در حال درمان":status==="waiting"?"در انتظار":status, balance:Number(row.balance??0), tags:(()=>{try{return JSON.parse(String(row.tags??"[]")) as string[]}catch{return []}})() }; }));
    const staffRows = (payload.staff ?? []) as Array<Record<string, unknown>>;
    setStaff(staffRows.map((row): StaffMember => ({ id:String(row.id), name:String(row.name), initials:String(row.name).slice(0,2), personnelType:String(row.personnelType)==="بیرونی"?"بیرونی":"داخلی", role:String(row.role), specialty:String(row.specialty??"—"), phone:String(row.phone??"—"), shift:String(row.shift??"تعیین نشده"), status:row.status==="active"?"فعال":String(row.status), revenueShare:Number(row.revenueShare??0), tone:"cyan" })));
    const leadRows = (payload.leads ?? []) as Array<Record<string, unknown>>;
    setLeads(leadRows.map((row): Lead => ({ id:String(row.id), name:String(row.name), phone:String(row.phone), source:String(row.source??"تماس مستقیم"), service:String(row.service??"ویزیت درد"), owner:String(row.owner??"پذیرش"), stage:(["new","contacted","booked","treated"].includes(String(row.stage))?String(row.stage):"new") as Lead["stage"], nextAction:String(row.nextAction??"تماس اولیه"), value:Number(row.value??0) })));
    const medicationRows = (payload.medications ?? []) as Array<Record<string, unknown>>;
    setMedications(medicationRows.map((row): Medication => ({ id:String(row.id), name:String(row.name), genericName:String(row.genericName??""), category:String(row.category??"عمومی"), stock:Number(row.stock??0), minStock:Number(row.minStock??5), unit:String(row.unit??"عدد"), unitPrice:Number(row.unitPrice??0), batch:String(row.batch??"—"), expiresAt:String(row.expiresAt??"—"), supplier:String(row.supplier??"—") })));
    const appointmentRows = (payload.appointments ?? []) as Array<Record<string, unknown>>;
    setAppointmentRecords(appointmentRows.map((row): AppointmentRecord => ({ id:String(row.id), patientId:row.patientId?String(row.patientId):null, patientName:String(row.patientName), nationalId:row.nationalId?String(row.nationalId):null, date:String(row.date), time:String(row.time), doctor:String(row.doctor), service:String(row.service), room:row.room?String(row.room):null, status:(["scheduled","arrived","in_progress","completed","cancelled"].includes(String(row.status))?String(row.status):"scheduled") as AppointmentRecord["status"], notes:row.notes?String(row.notes):null })));
    const transactionRows = (payload.transactions ?? []) as Array<Record<string, unknown>>;
    setTransactions(transactionRows.map((row): TransactionRecord => ({ id:String(row.id), patientId:row.patientId?String(row.patientId):null, counterparty:String(row.counterparty), category:String(row.category), description:String(row.description), amount:Number(row.amount??0), paymentMethod:row.paymentMethod?String(row.paymentMethod):null, status:(["paid","partial","pending"].includes(String(row.status))?String(row.status):"paid") as TransactionRecord["status"], createdAt:String(row.createdAt) })));
    const visitRows = (payload.visits ?? []) as Array<Record<string, unknown>>;
    setVisits(visitRows.map((row): VisitRecord => ({ id:String(row.id), patientId:String(row.patientId), doctor:String(row.doctor), chiefComplaint:row.chiefComplaint?String(row.chiefComplaint):null, diagnosis:row.diagnosis?String(row.diagnosis):null, treatment:row.treatment?String(row.treatment):null, medications:row.medications?String(row.medications):null, followUpAt:row.followUpAt?String(row.followUpAt):null, createdAt:String(row.createdAt) })));
    setServices((payload.services ?? []) as MedicalServiceRecord[]);
    setServiceShares((payload.serviceShares ?? []) as ServiceShareRecord[]);
    setTariffSettings((payload.tariffSettings ?? null) as TariffSettingsRecord | null);
    setUsers((payload.users ?? []) as UserAccountRecord[]);
    const referralRows = (payload.referrals ?? []) as Array<Record<string, unknown>>;
    const grouped = new Map<string,Referral>();
    referralRows.forEach((row)=>{ const name=String(row.colleagueName); const current=grouped.get(name)??{id:name,colleague:name,specialty:String(row.service??"شبکه همکاری"),referrals:0,converted:0,amount:0,due:0,lastReferral:String(row.createdAt??"—"),tone:"cyan"}; current.referrals+=1; if(["treated","completed"].includes(String(row.status))) current.converted+=1; current.amount+=Math.round(Number(row.tariffAmount??0)/10); current.due+=Math.round(Number(row.shareAmount??0)/10); grouped.set(name,current); });
    setReferrals(Array.from(grouped.values()));
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void reloadData(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }

  async function seedDemoData() {
    setSeedingDemo(true);
    try {
      await persist("demoSeed", {});
      await reloadData();
      showToast("داده‌های ساختگی آماده‌اند؛ همه بخش‌ها قابل تعامل هستند");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "ساخت داده نمونه ناموفق بود");
    } finally {
      setSeedingDemo(false);
    }
  }

  const todayIso = new Date().toISOString().slice(0, 10);
  const todayAppointments = appointmentRecords.filter((item)=>item.date===todayIso);
  const todayCompleted = todayAppointments.filter((item)=>item.status==="completed").length;
  const waitingToday = todayAppointments.filter((item)=>["scheduled","arrived","in_progress"].includes(item.status)).length;
  const openReceivables = transactions.filter((item)=>item.status!=="paid").reduce((sum,item)=>sum+item.amount,0);
  const lowStockItems = medications.filter((item)=>item.stock<=item.minStock);
  const actionAlerts = lowStockItems.length + leads.filter((item)=>item.stage==="new").length;
  const liveTasks = [
    { title: "تماس با سرنخ‌های جدید", detail: `${fa(leads.filter((item)=>item.stage==="new").length)} مورد نیازمند تماس`, icon: "pulse" as IconName, tone: "cyan" },
    { title: "پیگیری مطالبات مالی", detail: `${fa(transactions.filter((item)=>item.status!=="paid").length)} تراکنش باز`, icon: "wallet" as IconName, tone: "purple" },
    { title: "کنترل موجودی داروخانه", detail: `${fa(lowStockItems.length)} قلم زیر نقطه سفارش`, icon: "pill" as IconName, tone: "amber" },
  ];
  const dashboardAppointments = todayAppointments.slice(0,6).map((item)=>({
    ...item, name:item.patientName, initials:item.patientName.slice(0,2), tone:item.status==="arrived"||item.status==="completed"?"green":item.status==="in_progress"?"cyan":item.status==="cancelled"?"amber":"purple",
    statusLabel:item.status==="arrived"?"پذیرش شد":item.status==="in_progress"?"در حال ویزیت":item.status==="completed"?"تکمیل شد":item.status==="cancelled"?"لغو شد":"رزرو شده",
  }));
  const livePipeline = (["new","contacted","booked","treated"] as Lead["stage"][]).map((stage,index)=>{
    const items=leads.filter((item)=>item.stage===stage); const max=Math.max(1,...(["new","contacted","booked","treated"] as Lead["stage"][]).map((s)=>leads.filter((item)=>item.stage===s).length));
    return {label:["سرنخ جدید","تماس گرفته شد","نوبت رزرو شد","درمان و پیگیری"][index],count:items.length,amount:`${toman(items.reduce((sum,item)=>sum+item.value,0))}`,width:Math.max(3,items.length/max*100),color:["#27d8ff","#49d6a2","#168dff","#62bfff"][index]};
  });

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="منوی اصلی">
        <div className="brand">
          <div className="brand-mark"><img src="/ram-brand.jpg" alt="نشان رام" /></div>
          <div><strong>رام</strong><small>سامانه مدیریت کلینیک</small></div>
        </div>

        <nav className="main-nav">
          <p className="nav-title">فضای کاری</p>
          {visibleNavItems.map((item) => (
            <button key={item.key} className={`nav-item ${active === item.key ? "active" : ""}`} onClick={() => setActive(item.key)}>
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              {item.badge && <em>{item.badge}</em>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="capacity-card">
            <div className="capacity-head"><span>پیشرفت نوبت‌های امروز</span><strong>{fa(todayAppointments.length?Math.round(todayCompleted/todayAppointments.length*100):0)}٪</strong></div>
            <div className="progress"><i style={{ width: `${todayAppointments.length?todayCompleted/todayAppointments.length*100:0}%` }} /></div>
            <small>{fa(todayCompleted)} از {fa(todayAppointments.length)} نوبت تکمیل شده</small>
          </div>
          <button className="help-card" onClick={() => showToast("درخواست شما برای پشتیبانی ثبت شد")}> 
            <span className="help-icon">?</span>
            <span><strong>نیاز به راهنمایی؟</strong><small>ارتباط با پشتیبانی سامانه</small></span>
            <Icon name="arrow" size={17} />
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="mobile-brand"><div className="brand-mark small"><img src="/ram-brand.jpg" alt="نشان رام" /></div><strong>رام</strong></div>
          <div className={`top-search ${searchOpen ? "open" : ""}`}>
            <Icon name="search" size={19} />
            <input aria-label="جستجو" placeholder="جستجو در بیمار، پرونده، دارو یا همکار..." onFocus={() => setSearchOpen(true)} onBlur={() => setSearchOpen(false)} />
            <kbd>⌘ K</kbd>
          </div>
          <div className="top-actions">
            <button className="icon-button notification" aria-label="اعلان‌ها" onClick={() => showToast("۳ اعلان جدید دارید")}><Icon name="bell" /><i /></button>
            <div className="divider" />
            <label className="role-picker">
              <span className="avatar">{user.displayName.slice(0, 1)}</span>
              <span className="user-copy"><strong>{user.displayName}</strong><small>{role}</small></span>
              <a className="signout-link" href="/signout-with-chatgpt?return_to=/" aria-label="خروج از حساب">خروج</a>
            </label>
          </div>
        </header>

        <div className="content-wrap">
          {loading && <div className="system-banner loading"><span className="live-dot"/>در حال دریافت اطلاعات عملیاتی...</div>}
          {dataError && <div className="system-banner error"><Icon name="warning" size={17}/><span>{dataError}</span><button onClick={()=>void reloadData()}>تلاش دوباره</button></div>}
          {active === "dashboard" ? (
            <>
              <section className="welcome-row">
                <div>
                  <div className="eyebrow"><span className="live-dot" /> وضعیت کلینیک آنلاین است</div>
                  <h1>سلام، وقت بخیر <span>{user.displayName.split(" ")[0]}</span></h1>
                  <p>{formatToday()} · یک روز پربازده دیگر در کلینیک رام</p>
                </div>
                <div className="welcome-actions">
                  {role === "مدیر سیستم" && <button className="secondary-button demo-seed-button" disabled={seedingDemo} onClick={() => void seedDemoData()}>{seedingDemo ? "در حال آماده‌سازی..." : "داده نمونه تعاملی"}</button>}
                  <button className="primary-button" onClick={() => { setActive("patients"); showToast("فرم پذیرش بیمار باز شد"); }}><Icon name="plus" size={19} /> پذیرش بیمار جدید</button>
                </div>
              </section>

              <section className="stats-grid" aria-label="آمار امروز">
                <button className="stat-card accent-cyan" onClick={() => setActive("appointments")}>
                  <div className="stat-top"><span className="stat-icon"><Icon name="calendar" /></span><span className="trend">امروز</span></div>
                  <strong>{fa(todayAppointments.length)}</strong><h2>نوبت امروز</h2><p>{fa(todayCompleted)} مورد تکمیل‌شده</p>
                </button>
                <button className="stat-card accent-purple" onClick={() => setActive("appointments")}>
                  <div className="stat-top"><span className="stat-icon"><Icon name="calendar" /></span><span className="trend">امروز</span></div>
                  <strong>{fa(waitingToday)}</strong><h2>در صف درمان</h2><p>رزرو، پذیرش یا در حال ویزیت</p>
                </button>
                <button className="stat-card accent-green" onClick={() => setActive(permissions[role].includes("finance") ? "finance" : "appointments")}>
                  <div className="stat-top"><span className="stat-icon"><Icon name="wallet" /></span><span className="trend up">پیگیری</span></div>
                  <strong>{toman(openReceivables)}</strong><h2>مطالبات باز</h2><p>{fa(transactions.filter((item)=>item.status!=="paid").length)} تراکنش نیازمند تسویه</p>
                </button>
                <button className="stat-card accent-amber" onClick={() => setActive(permissions[role].includes("pharmacy") && lowStockItems.length ? "pharmacy" : permissions[role].includes("crm") ? "crm" : "appointments")}>
                  <div className="stat-top"><span className="stat-icon"><Icon name="warning" /></span><span className="trend alert">عملیاتی</span></div>
                  <strong>{fa(actionAlerts)}</strong><h2>نیازمند اقدام</h2><p>{fa(lowStockItems.length)} موجودی · {fa(leads.filter((item)=>item.stage==="new").length)} تماس</p>
                </button>
              </section>

              <section className="dashboard-grid">
                <article className="panel appointments-panel">
                  <div className="panel-head">
                    <div><span className="panel-kicker">برنامه روزانه</span><h2>مراجعین امروز</h2></div>
                    <button className="text-button" onClick={() => setActive("appointments")}>مشاهده همه <Icon name="arrow" size={16} /></button>
                  </div>
                  <div className="appointment-list">
                    {dashboardAppointments.length ? dashboardAppointments.map((item) => (
                      <button className="appointment-row" key={item.id} onClick={() => { setActive("appointments"); showToast(`نوبت ${item.name} باز شد`); }}>
                        <time>{item.time}</time>
                        <span className={`patient-avatar ${item.tone}`}>{item.initials}</span>
                        <span className="appointment-person"><strong>{item.name}</strong><small>{item.service}</small></span>
                        <span className="appointment-doctor">{item.doctor}</span>
                        <span className={`status ${item.tone}`}><i />{item.statusLabel}</span>
                        <Icon name="more" size={18} />
                      </button>
                    )) : <div className="empty-state"><Icon name="calendar" size={28}/><strong>برای امروز نوبتی ثبت نشده است</strong><small>از بخش نوبت‌ها، اولین نوبت را ثبت کنید.</small></div>}
                  </div>
                </article>

                <article className="panel tasks-panel">
                  <div className="panel-head"><div><span className="panel-kicker">نیازمند اقدام</span><h2>کارهای امروز</h2></div><span className="count-badge">{3 - taskDone.length}</span></div>
                  <div className="task-list">
                    {liveTasks.map((item, index) => {
                      const done = taskDone.includes(index);
                      return (
                        <button className={`task-row ${done ? "done" : ""}`} key={item.title} onClick={() => setTaskDone((old) => done ? old.filter((n) => n !== index) : [...old, index])}>
                          <span className={`task-icon ${item.tone}`}><Icon name={done ? "check" : item.icon} size={19} /></span>
                          <span><strong>{item.title}</strong><small>{done ? "انجام شد" : item.detail}</small></span>
                          <Icon name="arrow" size={17} />
                        </button>
                      );
                    })}
                  </div>
                  <button className="ghost-button" onClick={() => showToast("کار جدید به فهرست اضافه شد")}><Icon name="plus" size={17} /> افزودن کار جدید</button>
                </article>

                <article className="panel crm-panel">
                  <div className="panel-head">
                    <div><span className="panel-kicker">قیف فروش و پیگیری</span><h2>وضعیت CRM این ماه</h2></div>
                    <button className="text-button" onClick={() => setActive("crm")}>ورود به CRM <Icon name="arrow" size={16} /></button>
                  </div>
                  <div className="pipeline">
                    {livePipeline.map((item) => (
                      <div className="pipeline-row" key={item.label}>
                        <div className="pipeline-label"><span>{item.label}</span><strong>{item.count} نفر</strong></div>
                        <div className="pipeline-track"><i style={{ width: `${item.width}%`, background: item.color }} /></div>
                        <span className="pipeline-amount">{item.amount}</span>
                      </div>
                    ))}
                  </div>
                  <div className="crm-summary"><div><small>نرخ تبدیل</small><strong>{fa(leads.length?Math.round(leads.filter((item)=>item.stage==="treated").length/leads.length*100):0)}٪</strong></div><div><small>ارزش فرصت‌ها</small><strong>{toman(leads.filter((item)=>item.stage!=="treated").reduce((sum,item)=>sum+item.value,0))}</strong></div><div><small>نیازمند تماس</small><strong>{fa(leads.filter((item)=>item.stage==="new").length)} مورد</strong></div></div>
                </article>

                <article className="panel clinic-status-panel">
                  <div className="panel-head"><div><span className="panel-kicker">عملکرد زنده</span><h2>وضعیت بخش‌ها</h2></div><button className="icon-button"><Icon name="more" /></button></div>
                  <div className="department-ring-wrap">
                    <div className="department-ring"><div><strong>{fa(todayAppointments.length?Math.round(todayCompleted/todayAppointments.length*100):0)}٪</strong><small>تکمیل نوبت</small></div></div>
                    <ul>
                      <li><i className="cyan"/><span>نوبت امروز</span><strong>{fa(todayAppointments.length)}</strong></li>
                      <li><i className="purple"/><span>در حال ویزیت</span><strong>{fa(todayAppointments.filter((item)=>item.status==="in_progress").length)}</strong></li>
                      <li><i className="green"/><span>تکمیل‌شده</span><strong>{fa(todayCompleted)}</strong></li>
                      <li><i className="amber"/><span>در انتظار</span><strong>{fa(todayAppointments.filter((item)=>item.status==="scheduled").length)}</strong></li>
                    </ul>
                  </div>
                </article>
              </section>
            </>
          ) : <WorkspaceView active={active} role={role} patients={patients} staff={staff} leads={leads} setLeads={setLeads} medications={medications} referrals={referrals} appointmentRecords={appointmentRecords} transactions={transactions} visits={visits} services={services} serviceShares={serviceShares} tariffSettings={tariffSettings} users={users} currentEmail={user.email} currentColleagueName={user.colleagueName} reloadData={reloadData} showToast={showToast} />}
        </div>

        <nav className="mobile-nav" aria-label="منوی موبایل">
          {visibleNavItems.slice(0, 5).map((item) => <button key={item.key} className={active === item.key ? "active" : ""} onClick={() => setActive(item.key)}><Icon name={item.icon} size={20}/><span>{item.label.split(" ")[0]}</span></button>)}
        </nav>
      </main>

      {toast && <div className="toast"><span><Icon name="check" size={18} /></span>{toast}</div>}
    </div>
  );
}
