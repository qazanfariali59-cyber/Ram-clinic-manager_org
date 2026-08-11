"use client";

import { useMemo, useState } from "react";

export type MedicalServiceRecord = {
  id: string;
  nationalCode: string;
  title: string;
  category: string;
  feature: string;
  notes: string;
  tariffType: "standard" | "outpatient";
  totalValue: number;
  professionalValue: number;
  technicalValue: number;
  anesthesiaValue: string;
  customTariffRials: number | null;
  tariffRials: number;
  sourceYear: number;
  active: boolean;
};

export type ServiceShareRecord = {
  id: string;
  staffId: string;
  serviceId: string;
  shareType: "percentage" | "fixed";
  shareValue: number;
};

export type TariffSettingsRecord = {
  id: string;
  year: number;
  standardProfessionalK: number;
  standardTechnicalK: number;
  outpatientProfessionalK: number;
  outpatientTechnicalK: number;
};

export type ConsumableRecord = {
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

type StaffLite = {
  id: string;
  name: string;
  role: string;
  personnelType: "داخلی" | "بیرونی";
  revenueShare: number;
};

function fa(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("fa-IR", { maximumFractionDigits }).format(value);
}

function money(rials: number) {
  return {
    rial: `${fa(rials)} ریال`,
    toman: `${fa(Math.round(rials / 10))} تومان`,
  };
}

async function requestJson(url: string, options: RequestInit) {
  const response = await fetch(url, { ...options, headers: { "content-type": "application/json", ...(options.headers ?? {}) } });
  const payload = await response.json() as { error?: string };
  if (!response.ok) throw new Error(payload.error || "ذخیره تغییرات ناموفق بود");
  return payload;
}

export default function ServicesView({
  role,
  services,
  shares,
  settings,
  staff,
  consumables,
  reloadData,
  showToast,
}: {
  role: string;
  services: MedicalServiceRecord[];
  shares: ServiceShareRecord[];
  settings: TariffSettingsRecord | null;
  staff: StaffLite[];
  consumables: ConsumableRecord[];
  reloadData: () => Promise<void>;
  showToast: (message: string) => void;
}) {
  const canEdit = role === "مدیر سیستم";
  const colleagues = staff;
  const [section, setSection] = useState<"services" | "consumables">("services");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("همه خدمات");
  const [selectedStaffId, setSelectedStaffId] = useState(colleagues[0]?.id ?? "");
  const [editing, setEditing] = useState<MedicalServiceRecord | null>(null);
  const [addingService, setAddingService] = useState(false);
  const [editingConsumable, setEditingConsumable] = useState<ConsumableRecord | null>(null);
  const [addingConsumable, setAddingConsumable] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [savingKey, setSavingKey] = useState("");
  const [shareDraft, setShareDraft] = useState<Record<string, { type: "percentage" | "fixed"; value: string }>>({});

  const categories = useMemo(() => ["همه خدمات", ...Array.from(new Set(services.map((item) => item.category)))], [services]);
  const consumableCategories = useMemo(() => ["همه مواد", ...Array.from(new Set(consumables.map((item) => item.category).filter(Boolean)))], [consumables]);
  const selectedStaff = colleagues.find((item) => item.id === selectedStaffId) ?? null;
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return services.filter((item) => {
      const categoryMatch = category === "همه خدمات" || item.category === category;
      const queryMatch = !needle || `${item.nationalCode} ${item.title} ${item.category}`.toLowerCase().includes(needle);
      return categoryMatch && queryMatch;
    });
  }, [services, category, query]);
  const filteredConsumables = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return consumables.filter((item) => {
      const categoryMatch = category === "همه مواد" || item.category === category;
      const queryMatch = !needle || `${item.name} ${item.genericName} ${item.category} ${item.supplier}`.toLowerCase().includes(needle);
      return categoryMatch && queryMatch;
    });
  }, [consumables, category, query]);

  function changeSection(next: "services" | "consumables") {
    setSection(next);
    setQuery("");
    setCategory(next === "services" ? "همه خدمات" : "همه مواد");
  }

  function currentShare(service: MedicalServiceRecord) {
    const saved = shares.find((item) => item.serviceId === service.id && item.staffId === selectedStaffId);
    const draft = shareDraft[service.id];
    if (draft) return draft;
    if (saved) return { type: saved.shareType, value: String(saved.shareValue) };
    return { type: "percentage" as const, value: String(selectedStaff?.revenueShare ?? 0) };
  }

  function shareAmount(service: MedicalServiceRecord) {
    const share = currentShare(service);
    const value = Number(share.value || 0);
    return share.type === "fixed" ? value : Math.round(service.tariffRials * value / 100);
  }

  async function saveShare(service: MedicalServiceRecord) {
    if (!selectedStaffId) return showToast("ابتدا یک همکار را انتخاب کنید");
    const share = currentShare(service);
    setSavingKey(`share-${service.id}`);
    try {
      await requestJson("/api/clinic", {
        method: "POST",
        body: JSON.stringify({ entity: "serviceShare", data: { staffId: selectedStaffId, serviceId: service.id, shareType: share.type, shareValue: share.value } }),
      });
      await reloadData();
      showToast(`سهم ${selectedStaff?.name ?? "همکار"} برای این خدمت ذخیره شد`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "ذخیره سهم ناموفق بود");
    } finally {
      setSavingKey("");
    }
  }

  async function saveService(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing && !addingService) return;
    const form = new FormData(event.currentTarget);
    const useOfficial = form.get("useOfficial") === "on";
    setSavingKey(addingService ? "new-service" : `service-${editing?.id}`);
    try {
      await requestJson("/api/clinic", {
        method: addingService ? "POST" : "PATCH",
        body: JSON.stringify({
          entity: "service",
          ...(editing ? { id: editing.id } : {}),
          data: {
            nationalCode: form.get("nationalCode"), title: form.get("title"), category: form.get("category"),
            feature: form.get("feature"), notes: form.get("notes"), tariffType: form.get("tariffType"),
            professionalValue: form.get("professionalValue"), technicalValue: form.get("technicalValue"),
            anesthesiaValue: form.get("anesthesiaValue"),
            customTariffRials: useOfficial ? "" : form.get("customTariffRials"), useOfficial,
            sourceYear: settings?.year ?? 1405, active: form.get("active") === "on",
          },
        }),
      });
      await reloadData();
      setEditing(null);
      setAddingService(false);
      showToast(addingService ? "خدمت جدید تعریف شد" : "خدمت و تعرفه به‌روزرسانی شد");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "ذخیره خدمت ناموفق بود");
    } finally {
      setSavingKey("");
    }
  }

  async function saveConsumable(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingConsumable && !addingConsumable) return;
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    setSavingKey(addingConsumable ? "new-consumable" : `consumable-${editingConsumable?.id}`);
    try {
      await requestJson("/api/clinic", {
        method: addingConsumable ? "POST" : "PATCH",
        body: JSON.stringify({ entity: "medication", ...(editingConsumable ? { id: editingConsumable.id } : {}), data }),
      });
      await reloadData();
      setEditingConsumable(null);
      setAddingConsumable(false);
      showToast(addingConsumable ? "ماده مصرفی جدید تعریف شد" : "مشخصات و قیمت ماده مصرفی به‌روزرسانی شد");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "ذخیره ماده مصرفی ناموفق بود");
    } finally {
      setSavingKey("");
    }
  }

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings) return;
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    setSavingKey("settings");
    try {
      await requestJson("/api/clinic", { method: "PATCH", body: JSON.stringify({ entity: "tariffSetting", id: settings.id, data }) });
      await reloadData();
      setSettingsOpen(false);
      showToast("ضرایب تعرفه به‌روزرسانی شد");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "ویرایش ضرایب ناموفق بود");
    } finally {
      setSavingKey("");
    }
  }

  const serviceEditorOpen = Boolean(editing) || addingService;
  const consumableEditorOpen = Boolean(editingConsumable) || addingConsumable;

  return (
    <>
      <section className="module-header services-heading">
        <div><span>مدیریت کاتالوگ و قیمت‌گذاری</span><h1>خدمات، تعرفه‌ها و مواد مصرفی</h1><p>تعریف و ویرایش خدمات، ارزش نسبی، تعرفه بخش خصوصی، مواد مصرفی و سهم اختصاصی همکاران</p></div>
        {canEdit && <div className="module-actions">
          {section === "services" && <button className="secondary-button" onClick={() => setSettingsOpen(true)}>ضرایب سال</button>}
          <button className="primary-button" onClick={() => section === "services" ? setAddingService(true) : setAddingConsumable(true)}>{section === "services" ? "+ خدمت جدید" : "+ ماده مصرفی جدید"}</button>
        </div>}
      </section>

      <section className="catalog-tabs" aria-label="نوع کاتالوگ">
        <button className={section === "services" ? "active" : ""} onClick={() => changeSection("services")}>خدمات و تعرفه‌ها <span>{fa(services.length)}</span></button>
        {canEdit && <button className={section === "consumables" ? "active" : ""} onClick={() => changeSection("consumables")}>مواد مصرفی و قیمت‌ها <span>{fa(consumables.length)}</span></button>}
      </section>

      {section === "services" ? <>
        <section className="tariff-summary">
          <article><small>خدمات تعریف‌شده</small><strong>{fa(services.length)}</strong><span>خدمت مرتبط با کلینیک درد</span></article>
          <article><small>کای حرفه‌ای</small><strong>{fa(settings?.standardProfessionalK ?? 0)}</strong><span>ریال · بخش خصوصی</span></article>
          <article><small>کای فنی</small><strong>{fa(settings?.standardTechnicalK ?? 0)}</strong><span>ریال · بخش خصوصی</span></article>
          <article><small>سال مبنا</small><strong>{fa(settings?.year ?? 1405)}</strong><span>قابل ویرایش توسط مدیر</span></article>
        </section>

        <section className="panel services-panel">
          <div className="services-toolbar">
            <label className="services-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جستجو با نام خدمت یا کد..." /></label>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select>
            <label className="collaborator-picker"><span>سهم همکار</span><select value={selectedStaffId} onChange={(event) => { setSelectedStaffId(event.target.value); setShareDraft({}); }}><option value="">انتخاب همکار...</option>{colleagues.map((item) => <option value={item.id} key={item.id}>{item.name} · {item.role}</option>)}</select></label>
          </div>
          <div className="tariff-note"><strong>مبنای محاسبه:</strong> تعرفه = ارزش حرفه‌ای × کای حرفه‌ای + ارزش فنی × کای فنی. مدیر می‌تواند یک تعرفه ثابت جایگزین نیز ثبت کند؛ مواد و ملزومات مصرفی جداگانه محاسبه می‌شوند.</div>
          <div className="table-scroll services-table-wrap">
            <table className="data-table services-table">
              <thead><tr><th>کد خدمت</th><th>خدمت</th><th>ارزش نسبی</th><th>تعرفه ۱۴۰۵</th><th>سهم همکار انتخاب‌شده</th><th>مبلغ سهم</th><th></th></tr></thead>
              <tbody>
                {filtered.map((service) => {
                  const share = currentShare(service);
                  const amount = money(service.tariffRials);
                  return <tr key={service.id} className={!service.active ? "inactive-service" : ""}>
                    <td><strong className="service-code">{service.nationalCode}</strong><small>{service.feature || "کد تعریف‌شده"}</small></td>
                    <td><strong>{service.title}</strong><small>{service.category}{service.notes ? " · دارای توضیحات تکمیلی" : ""}</small></td>
                    <td><strong>ح {fa(service.professionalValue, 2)} · ف {fa(service.technicalValue, 2)}</strong><small>کل {fa(service.totalValue, 2)} · بیهوشی {service.anesthesiaValue}</small></td>
                    <td><strong className="tariff-value">{amount.toman}</strong><small>{amount.rial}{service.customTariffRials != null ? " · دستی" : " · محاسبه خودکار"}</small></td>
                    <td><div className="share-editor">
                      <select disabled={!canEdit || !selectedStaffId} value={share.type} onChange={(event) => setShareDraft((old) => ({ ...old, [service.id]: { ...share, type: event.target.value as "percentage" | "fixed" } }))}><option value="percentage">درصد</option><option value="fixed">مبلغ ثابت (ریال)</option></select>
                      <input disabled={!canEdit || !selectedStaffId} value={share.value} inputMode="decimal" onChange={(event) => setShareDraft((old) => ({ ...old, [service.id]: { ...share, value: event.target.value } }))} />
                      {canEdit && <button disabled={!selectedStaffId || savingKey === `share-${service.id}`} onClick={() => void saveShare(service)}>ذخیره</button>}
                    </div></td>
                    <td><strong>{money(shareAmount(service)).toman}</strong><small>{share.type === "percentage" ? `${fa(Number(share.value || 0), 2)}٪ از تعرفه` : "سهم ثابت"}</small></td>
                    <td>{canEdit && <button className="table-edit" onClick={() => setEditing(service)}>ویرایش</button>}</td>
                  </tr>;
                })}
                {!filtered.length && <tr><td colSpan={7}><div className="catalog-empty">خدمتی با این مشخصات پیدا نشد.</div></td></tr>}
              </tbody>
            </table>
          </div>
          <div className="table-footer"><span>نمایش {fa(filtered.length)} خدمت از {fa(services.length)} کد تعریف‌شده</span><a href="https://ta.mui.ac.ir/ابلاغ-تعرفه-های-تشخیصی-و-درمانی-سال-1405" target="_blank" rel="noreferrer">مشاهده منبع رسمی</a></div>
        </section>
      </> : <>
        <section className="tariff-summary consumable-summary">
          <article><small>مواد تعریف‌شده</small><strong>{fa(consumables.length)}</strong><span>دارو، کیت و ملزومات</span></article>
          <article><small>ارزش موجودی</small><strong>{fa(consumables.reduce((sum, item) => sum + item.stock * item.unitPrice, 0))}</strong><span>تومان</span></article>
          <article><small>زیر نقطه سفارش</small><strong>{fa(consumables.filter((item) => item.stock <= item.minStock).length)}</strong><span>نیازمند تأمین</span></article>
          <article><small>دسته‌بندی</small><strong>{fa(new Set(consumables.map((item) => item.category).filter(Boolean)).size)}</strong><span>گروه مصرفی</span></article>
        </section>
        <section className="panel services-panel consumables-panel">
          <div className="services-toolbar consumables-toolbar">
            <label className="services-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جستجو در نام، دسته یا تأمین‌کننده..." /></label>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>{consumableCategories.map((item) => <option key={item}>{item}</option>)}</select>
            <div className="catalog-manager-note">قیمت‌ها بر حسب تومان ثبت می‌شوند</div>
          </div>
          <div className="tariff-note"><strong>مدیریت مواد مصرفی:</strong> مدیر می‌تواند اقلام جدید، موجودی اولیه، نقطه سفارش و قیمت/تعرفه واحد را تعریف کند و بعداً همه مشخصات را تغییر دهد.</div>
          <div className="table-scroll services-table-wrap">
            <table className="data-table consumables-table">
              <thead><tr><th>نام ماده / کالا</th><th>دسته‌بندی</th><th>موجودی</th><th>واحد</th><th>قیمت/تعرفه واحد</th><th>بچ و انقضا</th><th>تأمین‌کننده</th><th></th></tr></thead>
              <tbody>
                {filteredConsumables.map((item) => <tr key={item.id}>
                  <td><strong>{item.name}</strong><small dir="ltr">{item.genericName || "—"}</small></td>
                  <td>{item.category || "عمومی"}</td>
                  <td><strong className={item.stock <= item.minStock ? "amount-due" : ""}>{fa(item.stock)}</strong><small>نقطه سفارش {fa(item.minStock)}</small></td>
                  <td>{item.unit}</td>
                  <td><strong className="tariff-value">{fa(item.unitPrice)} تومان</strong></td>
                  <td><strong>{item.batch || "—"}</strong><small>{item.expiresAt || "—"}</small></td>
                  <td>{item.supplier || "—"}</td>
                  <td><button className="table-edit" onClick={() => setEditingConsumable(item)}>ویرایش</button></td>
                </tr>)}
                {!filteredConsumables.length && <tr><td colSpan={8}><div className="catalog-empty">هنوز ماده مصرفی ثبت نشده یا نتیجه‌ای پیدا نشد.</div></td></tr>}
              </tbody>
            </table>
          </div>
          <div className="table-footer"><span>نمایش {fa(filteredConsumables.length)} قلم از {fa(consumables.length)} ماده و ملزومات تعریف‌شده</span></div>
        </section>
      </>}

      {serviceEditorOpen && <div className="modal-backdrop" onMouseDown={() => { setEditing(null); setAddingService(false); }}><section className="modal-card service-modal" onMouseDown={(event) => event.stopPropagation()}><header><div><span>{editing ? `کد ${editing.nationalCode}` : "تعریف کد جدید"}</span><h2>{editing ? "ویرایش خدمت و تعرفه" : "افزودن خدمت جدید"}</h2><p>تعرفه ثابت بر محاسبه مبتنی بر ارزش نسبی اولویت دارد.</p></div><button onClick={() => { setEditing(null); setAddingService(false); }}>×</button></header><form className="entity-form" onSubmit={saveService}>
        {!editing && <label><span>کد خدمت</span><input name="nationalCode" required dir="ltr" placeholder="مثلاً LOCAL-001" /></label>}
        <label className={editing ? "full" : ""}><span>عنوان خدمت</span><textarea name="title" defaultValue={editing?.title ?? ""} required /></label>
        <label><span>دسته‌بندی</span><input name="category" defaultValue={editing?.category ?? "سایر خدمات درد"} required /></label>
        <label><span>نوع محاسبه</span><select name="tariffType" defaultValue={editing?.tariffType ?? "standard"}><option value="standard">خدمت استاندارد</option><option value="outpatient">ویزیت / سرپایی</option></select></label>
        <label><span>علامت کتاب</span><input name="feature" defaultValue={editing?.feature ?? ""} placeholder="اختیاری: # یا *" /></label>
        <label><span>ارزش حرفه‌ای</span><input name="professionalValue" inputMode="decimal" defaultValue={editing?.professionalValue ?? 0} /></label>
        <label><span>ارزش فنی</span><input name="technicalValue" inputMode="decimal" defaultValue={editing?.technicalValue ?? 0} /></label>
        <label><span>ارزش بیهوشی</span><input name="anesthesiaValue" inputMode="decimal" defaultValue={editing?.anesthesiaValue ?? "0"} /></label>
        <label><span>تعرفه ثابت (ریال)</span><input name="customTariffRials" inputMode="numeric" defaultValue={editing?.customTariffRials ?? ""} placeholder="خالی = محاسبه خودکار" /></label>
        <label className="full"><span>توضیحات و محدودیت‌ها</span><textarea name="notes" defaultValue={editing?.notes ?? ""} placeholder="شرایط محاسبه، دفعات مجاز یا توضیح داخلی..." /></label>
        <label className="check-line"><input type="checkbox" name="useOfficial" defaultChecked={editing ? editing.customTariffRials == null : true} /><span>محاسبه با ضرایب ارزش نسبی</span></label>
        <label className="check-line"><input type="checkbox" name="active" defaultChecked={editing?.active ?? true} /><span>خدمت فعال باشد</span></label>
        <footer className="form-actions"><button type="button" className="secondary-button" onClick={() => { setEditing(null); setAddingService(false); }}>انصراف</button><button className="primary-button" disabled={savingKey === "new-service" || savingKey === `service-${editing?.id}`}>ذخیره خدمت</button></footer>
      </form></section></div>}

      {consumableEditorOpen && <div className="modal-backdrop" onMouseDown={() => { setEditingConsumable(null); setAddingConsumable(false); }}><section className="modal-card service-modal" onMouseDown={(event) => event.stopPropagation()}><header><div><span>کاتالوگ مواد و ملزومات</span><h2>{editingConsumable ? "ویرایش ماده مصرفی و قیمت" : "افزودن ماده مصرفی جدید"}</h2><p>قیمت واحد بر حسب تومان و موجودی بر اساس واحد انتخابی ثبت می‌شود.</p></div><button onClick={() => { setEditingConsumable(null); setAddingConsumable(false); }}>×</button></header><form className="entity-form" onSubmit={saveConsumable}>
        <label className="full"><span>نام ماده / کالا</span><input name="name" defaultValue={editingConsumable?.name ?? ""} required /></label>
        <label><span>نام ژنریک یا مدل</span><input name="genericName" dir="ltr" defaultValue={editingConsumable?.genericName ?? ""} /></label>
        <label><span>دسته‌بندی</span><input name="category" defaultValue={editingConsumable?.category ?? "مصرفی پروسیجر"} /></label>
        <label><span>موجودی</span><input name="stock" required inputMode="numeric" defaultValue={editingConsumable?.stock ?? 0} /></label>
        <label><span>نقطه سفارش</span><input name="minStock" inputMode="numeric" defaultValue={editingConsumable?.minStock ?? 5} /></label>
        <label><span>واحد</span><select name="unit" defaultValue={editingConsumable?.unit ?? "عدد"}><option>عدد</option><option>ویال</option><option>آمپول</option><option>سرنگ</option><option>کیت</option><option>بسته</option><option>ست</option><option>میلی‌لیتر</option></select></label>
        <label><span>قیمت/تعرفه واحد (تومان)</span><input name="unitPrice" inputMode="numeric" defaultValue={editingConsumable?.unitPrice ?? 0} /></label>
        <label><span>شماره بچ</span><input name="batch" dir="ltr" defaultValue={editingConsumable?.batch ?? ""} /></label>
        <label><span>تاریخ انقضا</span><input name="expiresAt" defaultValue={editingConsumable?.expiresAt === "—" ? "" : editingConsumable?.expiresAt ?? ""} placeholder="۱۴۰۶/۰۶/۳۱" /></label>
        <label className="full"><span>تأمین‌کننده</span><input name="supplier" defaultValue={editingConsumable?.supplier === "—" ? "" : editingConsumable?.supplier ?? ""} /></label>
        <footer className="form-actions"><button type="button" className="secondary-button" onClick={() => { setEditingConsumable(null); setAddingConsumable(false); }}>انصراف</button><button className="primary-button" disabled={savingKey === "new-consumable" || savingKey === `consumable-${editingConsumable?.id}`}>ذخیره ماده و قیمت</button></footer>
      </form></section></div>}

      {settingsOpen && settings && <div className="modal-backdrop" onMouseDown={() => setSettingsOpen(false)}><section className="modal-card service-modal" onMouseDown={(event) => event.stopPropagation()}><header><div><span>تعرفه بخش خصوصی {fa(settings.year)}</span><h2>ضرایب محاسبه تعرفه</h2><p>تمام مبالغ بر حسب ریال ثبت می‌شوند.</p></div><button onClick={() => setSettingsOpen(false)}>×</button></header><form className="entity-form" onSubmit={saveSettings}>
        <label><span>کای حرفه‌ای خدمات</span><input name="standardProfessionalK" inputMode="numeric" defaultValue={settings.standardProfessionalK} /></label>
        <label><span>کای فنی خدمات</span><input name="standardTechnicalK" inputMode="numeric" defaultValue={settings.standardTechnicalK} /></label>
        <label><span>کای حرفه‌ای ویزیت</span><input name="outpatientProfessionalK" inputMode="numeric" defaultValue={settings.outpatientProfessionalK} /></label>
        <label><span>کای فنی ویزیت</span><input name="outpatientTechnicalK" inputMode="numeric" defaultValue={settings.outpatientTechnicalK} /></label>
        <footer className="form-actions"><button type="button" className="secondary-button" onClick={() => setSettingsOpen(false)}>انصراف</button><button className="primary-button" disabled={savingKey === "settings"}>اعمال ضرایب</button></footer>
      </form></section></div>}
    </>
  );
}
