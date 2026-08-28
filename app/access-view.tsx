"use client";

import { useMemo, useState } from "react";

export type UserAccountRecord = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  colleagueName: string | null;
  patientId: string | null;
  status: "active" | "pending" | "suspended";
  createdAt: string;
};

type StaffOption = {
  id: string;
  name: string;
  personnelType: "داخلی" | "بیرونی";
};

type PatientOption = {
  id: string;
  name: string;
  nationalId: string;
};

const roles = ["مدیر سیستم", "پذیرش", "پزشک", "حسابداری", "داروخانه", "همکار بیرونی", "بیمار"];
const roleDetails: Record<string, string> = {
  "مدیر سیستم": "دسترسی کامل، تنظیمات، کاربران و گزارش‌ها",
  "پذیرش": "بیماران، نوبت‌ها، CRM و ثبت ارجاع",
  "پزشک": "پرونده درمانی، نوبت‌ها و گزارش بالینی",
  "حسابداری": "تراکنش‌ها، سهم همکاران و گزارش مالی",
  "داروخانه": "موجودی، فروش داروخانه و گزارش مرتبط",
  "همکار بیرونی": "فقط ارجاعات و سهم خدمات همان همکار",
  "بیمار": "فقط پرونده، نوبت، درمان و پرداخت‌های همان بیمار",
};
const statusLabels = { active: "فعال", pending: "در انتظار", suspended: "تعلیق‌شده" } as const;

function fa(value: number) {
  return new Intl.NumberFormat("fa-IR").format(value);
}

async function requestJson(url: string, init: RequestInit) {
  const response = await fetch(url, { ...init, headers: { "content-type": "application/json", ...(init.headers ?? {}) } });
  const payload = await response.json() as { error?: string };
  if (!response.ok) throw new Error(payload.error || "ذخیره دسترسی ناموفق بود");
  return payload;
}

export default function AccessView({
  users,
  staff,
  patients,
  currentEmail,
  reloadData,
  showToast,
}: {
  users: UserAccountRecord[];
  staff: StaffOption[];
  patients: PatientOption[];
  currentEmail: string;
  reloadData: () => Promise<void>;
  showToast: (message: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("همه");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<UserAccountRecord | null>(null);
  const [selectedRole, setSelectedRole] = useState("پذیرش");
  const [busy, setBusy] = useState(false);
  const externalColleagues = staff.filter((item) => item.personnelType === "بیرونی");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return users.filter((item) => {
      const queryMatch = !needle || `${item.displayName} ${item.email} ${item.role} ${item.colleagueName ?? ""}`.toLowerCase().includes(needle);
      const statusMatch = status === "همه" || item.status === status;
      return queryMatch && statusMatch;
    });
  }, [query, status, users]);

  async function saveAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    setBusy(true);
    try {
      await requestJson("/api/clinic", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify({ entity: "userAccount", ...(editing ? { id: editing.id } : {}), data }),
      });
      await reloadData();
      setAdding(false);
      setEditing(null);
      setSelectedRole("پذیرش");
      showToast(editing ? "دسترسی کاربر به‌روزرسانی شد" : "حساب کاربری آماده شد");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "ذخیره دسترسی ناموفق بود");
    } finally {
      setBusy(false);
    }
  }

  async function approve(user: UserAccountRecord) {
    setBusy(true);
    try {
      await requestJson("/api/clinic", {
        method: "PATCH",
        body: JSON.stringify({ entity: "userAccount", id: user.id, data: { status: "active" } }),
      });
      await reloadData();
      showToast(`دسترسی ${user.displayName} فعال شد`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "فعال‌سازی ناموفق بود");
    } finally {
      setBusy(false);
    }
  }

  const editorOpen = adding || Boolean(editing);
  const defaultStatus = editing?.status ?? "active";
  const patientNames = useMemo(() => new Map(patients.map((item) => [item.id, item.name])), [patients]);

  return (
    <>
      <section className="module-header access-heading">
        <div><span>کنترل دسترسی عملیاتی</span><h1>کاربران و نقش‌ها</h1><p>تأیید کاربران جدید، تعیین نقش و اتصال حساب همکاران بیرونی به پرونده همکاری</p></div>
        <div className="module-actions"><button className="primary-button" onClick={() => { setEditing(null); setSelectedRole("پذیرش"); setAdding(true); }}>+ افزودن کاربر</button></div>
      </section>

      <section className="metrics-row four">
        <article className="metric-card cyan"><span className="metric-icon">ک</span><div><small>کل حساب‌ها</small><strong>{fa(users.length)}</strong><p>حساب ثبت‌شده</p></div></article>
        <article className="metric-card green"><span className="metric-icon">ف</span><div><small>فعال</small><strong>{fa(users.filter((item) => item.status === "active").length)}</strong><p>دارای دسترسی</p></div></article>
        <article className="metric-card amber"><span className="metric-icon">ا</span><div><small>در انتظار تأیید</small><strong>{fa(users.filter((item) => item.status === "pending").length)}</strong><p>نیازمند بررسی مدیر</p></div></article>
        <article className="metric-card purple"><span className="metric-icon">ب</span><div><small>همکار بیرونی</small><strong>{fa(users.filter((item) => item.role === "همکار بیرونی" && item.status === "active").length)}</strong><p>متصل به شبکه ارجاع</p></div></article>
      </section>

      <section className="access-layout">
        <article className="panel access-users-panel">
          <div className="data-toolbar">
            <label className="inline-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جستجو با نام، ایمیل یا نقش..." /></label>
            <div className="filter-tabs">
              {[{ value: "همه", label: "همه" }, { value: "pending", label: "در انتظار" }, { value: "active", label: "فعال" }, { value: "suspended", label: "تعلیق‌شده" }].map((item) => <button key={item.value} className={status === item.value ? "active" : ""} onClick={() => setStatus(item.value)}>{item.label}</button>)}
            </div>
          </div>
          <div className="table-scroll">
            <table className="data-table access-table">
              <thead><tr><th>کاربر</th><th>نقش</th><th>اتصال سازمانی</th><th>وضعیت</th><th>تاریخ ثبت</th><th></th></tr></thead>
              <tbody>
                {filtered.map((user) => <tr key={user.id}>
                  <td><div className="identity"><span className="patient-avatar cyan">{user.displayName.slice(0, 2)}</span><div><strong>{user.displayName}{user.email === currentEmail && <em className="self-badge">شما</em>}</strong><small dir="ltr">{user.email}</small></div></div></td>
                  <td><strong>{user.role}</strong><small>{roleDetails[user.role]}</small></td>
                  <td>{user.role === "همکار بیرونی" ? <strong>{user.colleagueName || "اتصال تعیین نشده"}</strong> : user.role === "بیمار" ? <strong>{patientNames.get(user.patientId ?? "") || "پرونده متصل نشده"}</strong> : <span className="muted-cell">عضو داخلی سامانه</span>}</td>
                  <td><span className={`status ${user.status === "active" ? "green" : user.status === "pending" ? "amber" : "purple"}`}><i/>{statusLabels[user.status]}</span></td>
                  <td><small>{new Date(user.createdAt).toLocaleDateString("fa-IR")}</small></td>
                  <td><div className="row-actions">{user.status === "pending" && user.role !== "همکار بیرونی" && user.role !== "بیمار" && <button disabled={busy} className="approve-button" onClick={() => void approve(user)}>تأیید</button>}<button className="edit-button" onClick={() => { setSelectedRole(user.role); setEditing(user); }}>ویرایش</button></div></td>
                </tr>)}
                {!filtered.length && <tr><td colSpan={6}><div className="empty-state"><strong>کاربری با این فیلتر پیدا نشد</strong><small>فیلتر را تغییر دهید یا یک حساب جدید اضافه کنید.</small></div></td></tr>}
              </tbody>
            </table>
          </div>
        </article>

        <aside className="panel access-roles-panel">
          <div className="panel-head"><div><span className="panel-kicker">اصل حداقل دسترسی</span><h2>سطوح نقش‌ها</h2></div></div>
          <div className="role-scope-list">{roles.map((role) => <div key={role}><span>{role.slice(0, 1)}</span><p><strong>{role}</strong><small>{roleDetails[role]}</small></p><em>{fa(users.filter((item) => item.role === role && item.status === "active").length)}</em></div>)}</div>
          <div className="security-note"><strong>ورود امن</strong><p>هر حساب پس از ورود با ChatGPT شناسایی می‌شود و تمام عملیات مهم همراه با کاربر و نقش او ثبت می‌گردد.</p></div>
        </aside>
      </section>

      {editorOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => { setAdding(false); setEditing(null); }}>
        <section className="modal-card" role="dialog" aria-modal="true" aria-label={editing ? "ویرایش دسترسی" : "افزودن کاربر"} onMouseDown={(event) => event.stopPropagation()}>
          <header><div><span>امنیت سامانه رام</span><h2>{editing ? "ویرایش حساب و دسترسی" : "افزودن کاربر جدید"}</h2><p>نقش هر کاربر فقط اطلاعات مورد نیاز همان مسئولیت را نمایش می‌دهد.</p></div><button onClick={() => { setAdding(false); setEditing(null); }} aria-label="بستن">×</button></header>
          <form className={`entity-form access-editor ${selectedRole === "همکار بیرونی" ? "external-role" : ""} ${selectedRole === "بیمار" ? "patient-role" : ""}`} onSubmit={saveAccount}>
            <label className="full"><span>نام نمایشی</span><input name="displayName" required defaultValue={editing?.displayName ?? ""} /></label>
            <label className="full"><span>ایمیل حساب ChatGPT</span><input name="email" type="email" required dir="ltr" defaultValue={editing?.email ?? ""} readOnly={Boolean(editing)} /></label>
            <label><span>نقش کاربری</span><select name="role" value={selectedRole} onChange={(event) => setSelectedRole(event.target.value)}>
              {roles.map((role) => <option key={role}>{role}</option>)}
            </select></label>
            <label><span>وضعیت</span><select name="status" defaultValue={defaultStatus}><option value="active">فعال</option><option value="pending">در انتظار تأیید</option><option value="suspended">تعلیق‌شده</option></select></label>
            <label className="full colleague-link-field"><span>اتصال به همکار بیرونی</span><select name="colleagueName" defaultValue={editing?.colleagueName ?? ""}><option value="">انتخاب پرونده همکار...</option>{externalColleagues.map((item) => <option key={item.id}>{item.name}</option>)}</select><small>فقط برای نقش «همکار بیرونی» الزامی است.</small></label>
            <label className="full patient-link-field"><span>اتصال به پرونده بیمار</span><select name="patientId" defaultValue={editing?.patientId ?? ""}><option value="">انتخاب پرونده بیمار...</option>{patients.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.nationalId}</option>)}</select><small>نقش بیمار فقط تایملاین همین پرونده را مشاهده می‌کند.</small></label>
            <div className="form-note full"><span>تغییر نقش یا وضعیت، از بارگذاری بعدی صفحه برای آن کاربر اعمال می‌شود.</span></div>
            <footer className="form-actions"><button type="button" className="secondary-button" onClick={() => { setAdding(false); setEditing(null); }}>انصراف</button><button className="primary-button" disabled={busy}>{busy ? "در حال ذخیره..." : "ذخیره دسترسی"}</button></footer>
          </form>
        </section>
      </div>}
    </>
  );
}
