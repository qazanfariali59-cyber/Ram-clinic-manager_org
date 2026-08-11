import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import {
  appointments, auditLogs, clinicalVisits, collaboratorServiceShares, crmLeads, financialTransactions,
  medicalServices, medications, patients, referrals, staff, tariffSettings,
} from "../../../db/schema";
import { PAIN_SERVICES_1405, TARIFF_SOURCE_1405 } from "../../data/pain-services-1405";
import { canAccess, getAccessUser, type AccessUser } from "../../access";

export const dynamic = "force-dynamic";

const id = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
const clean = (value: unknown) => typeof value === "string" ? value.trim() : "";
const latinDigits = (value: unknown) => clean(value).replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))).replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
const number = (value: unknown) => { const parsed = Number(latinDigits(value).replace(/[٬,\s]/g, "")); return Number.isFinite(parsed) ? Math.round(parsed) : 0; };
const decimal = (value: unknown) => { const parsed = Number(latinDigits(value).replace(/[٬,\s]/g, "").replace("/", ".")); return Number.isFinite(parsed) ? parsed : 0; };
const storageUnavailable = (error: unknown) => /binding|no such table|D1/i.test(error instanceof Error ? error.message : String(error));

type TariffConfig = typeof tariffSettings.$inferSelect;
type MedicalService = typeof medicalServices.$inferSelect;

function calculateTariffRials(service: MedicalService, settings: TariffConfig) {
  if (service.customTariffRials != null) return Math.max(0, service.customTariffRials);
  const outpatient = service.tariffType === "outpatient";
  const professionalK = outpatient ? settings.outpatientProfessionalK : settings.standardProfessionalK;
  const technicalK = outpatient ? settings.outpatientTechnicalK : settings.standardTechnicalK;
  return Math.round(service.professionalValue * professionalK + service.technicalValue * technicalK);
}

async function ensureServiceCatalog() {
  const db = getDb();
  let [settings] = await db.select().from(tariffSettings).where(eq(tariffSettings.year, TARIFF_SOURCE_1405.year)).limit(1);
  if (!settings) {
    [settings] = await db.insert(tariffSettings).values({
      id: `TARIFF-${TARIFF_SOURCE_1405.year}`,
      year: TARIFF_SOURCE_1405.year,
      standardProfessionalK: TARIFF_SOURCE_1405.standardProfessionalK,
      standardTechnicalK: TARIFF_SOURCE_1405.standardTechnicalK,
      outpatientProfessionalK: TARIFF_SOURCE_1405.outpatientProfessionalK,
      outpatientTechnicalK: TARIFF_SOURCE_1405.outpatientTechnicalK,
      sector: "private",
    }).onConflictDoNothing({ target: tariffSettings.year }).returning();
    if (!settings) [settings] = await db.select().from(tariffSettings).where(eq(tariffSettings.year, TARIFF_SOURCE_1405.year)).limit(1);
  }
  const [countRow] = await db.select({ count: sql<number>`count(*)` }).from(medicalServices);
  if (Number(countRow?.count ?? 0) < PAIN_SERVICES_1405.length) {
    const values = PAIN_SERVICES_1405.map((service) => ({
      id: `SVC-${service.nationalCode}`,
      ...service,
      sourceYear: TARIFF_SOURCE_1405.year,
      sourceTitle: TARIFF_SOURCE_1405.sourceTitle,
      sourceUrl: TARIFF_SOURCE_1405.sourceUrl,
    }));
    for (let offset = 0; offset < values.length; offset += 25) {
      await db.insert(medicalServices).values(values.slice(offset, offset + 25)).onConflictDoNothing({ target: medicalServices.nationalCode });
    }
  }
  return settings;
}

async function authorized(entity?: string) {
  const user = await getAccessUser();
  return user && (!entity || canAccess(user, entity)) ? user : null;
}

async function audit(user: AccessUser, action: string, entity: string, entityId?: string, details: Record<string, unknown> = {}) {
  await getDb().insert(auditLogs).values({
    id: id("AUD"), actorEmail: user.email, actorRole: user.role, action, entity, entityId,
    details: JSON.stringify(details),
  });
}

export async function GET() {
  try {
    const user = await authorized();
    if (!user) return Response.json({ error: "ورود یا دسترسی معتبر نیست" }, { status: 401 });
    const db = getDb();
    const activeTariff = await ensureServiceCatalog();
    const referralQuery = user.role === "همکار بیرونی" && user.colleagueName
      ? db.select().from(referrals).where(eq(referrals.colleagueName, user.colleagueName)).orderBy(desc(referrals.createdAt)).limit(250)
      : db.select().from(referrals).orderBy(desc(referrals.createdAt)).limit(250);
    const [patientRows, staffRows, leadRows, medicationRows, referralRows, appointmentRows, transactionRows, visitRows] = await Promise.all([
      canAccess(user, "patient") ? db.select().from(patients).orderBy(desc(patients.createdAt)).limit(500) : Promise.resolve([]),
      canAccess(user, "staff") ? db.select().from(staff).orderBy(desc(staff.createdAt)).limit(300) : Promise.resolve([]),
      canAccess(user, "lead") ? db.select().from(crmLeads).orderBy(desc(crmLeads.createdAt)).limit(500) : Promise.resolve([]),
      canAccess(user, "medication") ? db.select().from(medications).orderBy(desc(medications.createdAt)).limit(500) : Promise.resolve([]),
      referralQuery,
      canAccess(user, "appointment") ? db.select().from(appointments).orderBy(desc(appointments.date), desc(appointments.time)).limit(500) : Promise.resolve([]),
      canAccess(user, "transaction") ? db.select().from(financialTransactions).orderBy(desc(financialTransactions.createdAt)).limit(500) : Promise.resolve([]),
      canAccess(user, "visit") ? db.select().from(clinicalVisits).orderBy(desc(clinicalVisits.createdAt)).limit(500) : Promise.resolve([]),
    ]);
    const serviceRows = canAccess(user, "service")
      ? (user.role === "مدیر سیستم"
        ? await db.select().from(medicalServices).orderBy(medicalServices.category, medicalServices.nationalCode).limit(500)
        : await db.select().from(medicalServices).where(eq(medicalServices.active, true)).orderBy(medicalServices.category, medicalServices.nationalCode).limit(500))
      : [];
    let shareRows: typeof collaboratorServiceShares.$inferSelect[] = [];
    if (user.role === "مدیر سیستم" || user.role === "حسابداری") {
      shareRows = await db.select().from(collaboratorServiceShares).where(eq(collaboratorServiceShares.active, true)).limit(2000);
    } else if (user.role === "همکار بیرونی" && user.colleagueName) {
      const [colleague] = await db.select().from(staff).where(eq(staff.name, user.colleagueName)).limit(1);
      if (colleague) shareRows = await db.select().from(collaboratorServiceShares).where(and(eq(collaboratorServiceShares.staffId, colleague.id), eq(collaboratorServiceShares.active, true))).limit(500);
    }
    return Response.json({
      patients: patientRows, staff: staffRows, leads: leadRows, medications: medicationRows,
      referrals: referralRows, appointments: appointmentRows, transactions: transactionRows, visits: visitRows,
      services: serviceRows.map((service) => ({ ...service, tariffRials: calculateTariffRials(service, activeTariff) })),
      serviceShares: shareRows,
      tariffSettings: activeTariff,
      storage: "connected", serverTime: new Date().toISOString(),
    });
  } catch (error) {
    if (storageUnavailable(error)) return Response.json({ error: "پایگاه‌داده در حال آماده‌سازی است", storage: "initializing" }, { status: 503 });
    return Response.json({ error: "خواندن اطلاعات سامانه ناموفق بود" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as { entity?: string; data?: Record<string, unknown> };
    const data = payload.data ?? {};
    const permissionEntity = payload.entity === "sale" ? "medication" : payload.entity === "serviceShare" ? "service" : payload.entity;
    const user = await authorized(permissionEntity);
    if (!user) return Response.json({ error: "برای این عملیات دسترسی ندارید" }, { status: 403 });
    const db = getDb();

    if (payload.entity === "service") {
      if (user.role !== "مدیر سیستم") return Response.json({ error: "تعریف خدمت جدید فقط برای مدیر سامانه مجاز است" }, { status: 403 });
      const nationalCode = clean(data.nationalCode), title = clean(data.title), category = clean(data.category);
      if (!nationalCode || !title || !category) return Response.json({ error: "کد خدمت، عنوان و دسته‌بندی الزامی است" }, { status: 400 });
      const [duplicate] = await db.select({ id: medicalServices.id }).from(medicalServices).where(eq(medicalServices.nationalCode, nationalCode)).limit(1);
      if (duplicate) return Response.json({ error: "این کد خدمت قبلاً تعریف شده است" }, { status: 409 });
      const professionalValue = Math.max(0, decimal(data.professionalValue));
      const technicalValue = Math.max(0, decimal(data.technicalValue));
      const customTariffText = clean(data.customTariffRials);
      const [row] = await db.insert(medicalServices).values({
        id: id("SVC"), nationalCode, title, category,
        feature: clean(data.feature), notes: clean(data.notes),
        tariffType: clean(data.tariffType) === "outpatient" ? "outpatient" : "standard",
        totalValue: professionalValue + technicalValue, professionalValue, technicalValue,
        anesthesiaValue: clean(data.anesthesiaValue) || "0",
        customTariffRials: customTariffText ? Math.max(0, number(data.customTariffRials)) : null,
        sourceYear: number(data.sourceYear) || TARIFF_SOURCE_1405.year,
        sourceTitle: "تعریف‌شده توسط مدیر سامانه",
        sourceUrl: TARIFF_SOURCE_1405.sourceUrl,
        active: data.active == null ? true : data.active === true || data.active === "true",
      }).returning();
      await audit(user, "create", "service", row.id, { nationalCode });
      return Response.json({ record: row }, { status: 201 });
    }

    if (payload.entity === "serviceShare") {
      if (user.role !== "مدیر سیستم") return Response.json({ error: "ویرایش سهم خدمات فقط برای مدیر سامانه مجاز است" }, { status: 403 });
      const staffId = clean(data.staffId), serviceId = clean(data.serviceId);
      const shareType = clean(data.shareType) === "fixed" ? "fixed" : "percentage";
      const shareValue = Math.max(0, decimal(data.shareValue));
      if (!staffId || !serviceId || (shareType === "percentage" && shareValue > 100))
        return Response.json({ error: "همکار، خدمت و مقدار سهم معتبر الزامی است" }, { status: 400 });
      const [[staffRow], [serviceRow]] = await Promise.all([
        db.select().from(staff).where(eq(staff.id, staffId)).limit(1),
        db.select().from(medicalServices).where(eq(medicalServices.id, serviceId)).limit(1),
      ]);
      if (!staffRow || !serviceRow) return Response.json({ error: "همکار یا خدمت انتخاب‌شده پیدا نشد" }, { status: 404 });
      const [row] = await db.insert(collaboratorServiceShares).values({
        id: id("SHR"), staffId, serviceId, shareType, shareValue,
      }).onConflictDoUpdate({
        target: [collaboratorServiceShares.staffId, collaboratorServiceShares.serviceId],
        set: { shareType, shareValue, active: true },
      }).returning();
      await audit(user, "upsert", "serviceShare", row.id, { staffId, serviceId, shareType, shareValue });
      return Response.json({ record: row }, { status: 201 });
    }

    if (payload.entity === "patient") {
      const nationalId = latinDigits(data.nationalId), name = clean(data.name), phone = latinDigits(data.phone);
      if (!/^\d{10}$/.test(nationalId) || !name || !/^09\d{9}$/.test(phone.replace(/\s/g, "")))
        return Response.json({ error: "نام، موبایل معتبر و کد ملی ده‌رقمی الزامی است" }, { status: 400 });
      const [row] = await db.insert(patients).values({
        id: id("PAT"), nationalId, name, phone: phone.replace(/\s/g, ""), birthDate: clean(data.birthDate) || null,
        gender: clean(data.gender) || null, city: clean(data.city) || null, service: clean(data.service) || null,
        doctor: clean(data.doctor) || null, tags: JSON.stringify(Array.isArray(data.tags) ? data.tags : []),
      }).returning();
      await audit(user, "create", "patient", row.id); return Response.json({ record: row }, { status: 201 });
    }

    if (payload.entity === "appointment") {
      const patientId = clean(data.patientId), date = clean(data.date), time = clean(data.time), doctor = clean(data.doctor), service = clean(data.service);
      const [patient] = patientId ? await db.select().from(patients).where(eq(patients.id, patientId)).limit(1) : [];
      const patientName = patient?.name ?? clean(data.patientName);
      if (!patientName || !date || !time || !doctor || !service) return Response.json({ error: "بیمار، تاریخ، ساعت، پزشک و خدمت الزامی است" }, { status: 400 });
      const [row] = await db.insert(appointments).values({
        id: id("APT"), patientId: patient?.id ?? null, patientName, nationalId: patient?.nationalId ?? (clean(data.nationalId) || null),
        date, time, doctor, service, room: clean(data.room) || null, status: "scheduled", notes: clean(data.notes) || null,
      }).returning();
      await audit(user, "create", "appointment", row.id); return Response.json({ record: row }, { status: 201 });
    }

    if (payload.entity === "staff") {
      const name = clean(data.name), role = clean(data.role), personnelType = clean(data.personnelType);
      if (!name || !role || !personnelType) return Response.json({ error: "نام، نقش و نوع همکاری الزامی است" }, { status: 400 });
      const [row] = await db.insert(staff).values({
        id: id("STF"), name, role, personnelType, specialty: clean(data.specialty) || null,
        phone: latinDigits(data.phone) || null, shift: clean(data.shift) || null, revenueShare: Math.min(100, Math.max(0, number(data.revenueShare))),
      }).returning();
      await audit(user, "create", "staff", row.id); return Response.json({ record: row }, { status: 201 });
    }

    if (payload.entity === "lead") {
      const name = clean(data.name), phone = latinDigits(data.phone);
      if (!name || !phone) return Response.json({ error: "نام و موبایل الزامی است" }, { status: 400 });
      const [row] = await db.insert(crmLeads).values({
        id: id("LEAD"), name, phone, source: clean(data.source) || null, service: clean(data.service) || null,
        owner: clean(data.owner) || user.displayName, stage: clean(data.stage) || "new", nextAction: clean(data.nextAction) || "تماس اولیه",
        nextActionAt: clean(data.nextActionAt) || null, value: Math.max(0, number(data.value)), notes: clean(data.notes) || null,
      }).returning();
      await audit(user, "create", "lead", row.id); return Response.json({ record: row }, { status: 201 });
    }

    if (payload.entity === "medication") {
      const name = clean(data.name);
      if (!name) return Response.json({ error: "نام دارو یا ماده مصرفی الزامی است" }, { status: 400 });
      const [row] = await db.insert(medications).values({
        id: id("MED"), name, genericName: clean(data.genericName) || null, category: clean(data.category) || null,
        stock: Math.max(0, number(data.stock)), minStock: Math.max(0, number(data.minStock) || 5), unit: clean(data.unit) || "عدد",
        unitPrice: Math.max(0, number(data.unitPrice)), batch: clean(data.batch) || null, expiresAt: clean(data.expiresAt) || null,
        supplier: clean(data.supplier) || null,
      }).returning();
      await audit(user, "create", "medication", row.id); return Response.json({ record: row }, { status: 201 });
    }

    if (payload.entity === "sale") {
      const medicationId = clean(data.medicationId), count = Math.max(1, number(data.count));
      const [item] = await db.select().from(medications).where(eq(medications.id, medicationId)).limit(1);
      if (!item) return Response.json({ error: "قلم دارویی پیدا نشد" }, { status: 404 });
      if (item.stock < count) return Response.json({ error: `موجودی کافی نیست؛ موجودی فعلی ${item.stock} ${item.unit} است` }, { status: 400 });
      const [updated] = await db.update(medications).set({ stock: item.stock - count }).where(eq(medications.id, medicationId)).returning();
      const [transaction] = await db.insert(financialTransactions).values({
        id: id("TXN"), counterparty: clean(data.buyer) || "فروش داروخانه", category: "pharmacy",
        description: `${count} ${item.unit} ${item.name}`, amount: item.unitPrice * count,
        paymentMethod: clean(data.paymentMethod) || "کارتخوان", status: clean(data.status) || "paid", referenceId: item.id,
      }).returning();
      await audit(user, "create", "sale", transaction.id, { medicationId, count });
      return Response.json({ medication: updated, transaction }, { status: 201 });
    }

    if (payload.entity === "transaction") {
      const counterparty = clean(data.counterparty), description = clean(data.description), amount = number(data.amount);
      if (!counterparty || !description || amount <= 0) return Response.json({ error: "طرف حساب، شرح و مبلغ معتبر الزامی است" }, { status: 400 });
      const [row] = await db.insert(financialTransactions).values({
        id: id("TXN"), patientId: clean(data.patientId) || null, counterparty, category: clean(data.category) || "service",
        description, amount, paymentMethod: clean(data.paymentMethod) || null, status: clean(data.status) || "paid",
        referenceId: clean(data.referenceId) || null,
      }).returning();
      await audit(user, "create", "transaction", row.id); return Response.json({ record: row }, { status: 201 });
    }

    if (payload.entity === "referral") {
      const nationalId = latinDigits(data.nationalId);
      const colleagueName = user.role === "همکار بیرونی" ? (user.colleagueName ?? "") : clean(data.colleagueName);
      if (!/^\d{10}$/.test(nationalId) || !colleagueName) return Response.json({ error: "کد ملی ده‌رقمی و همکار ارجاع‌دهنده الزامی است" }, { status: 400 });
      const serviceId = clean(data.serviceId);
      const [[serviceRow], [colleague]] = await Promise.all([
        serviceId ? db.select().from(medicalServices).where(eq(medicalServices.id, serviceId)).limit(1) : Promise.resolve([]),
        db.select().from(staff).where(eq(staff.name, colleagueName)).limit(1),
      ]);
      let tariffAmount = 0, shareAmount = 0, shareType = "percentage", shareValue = Number(colleague?.revenueShare ?? 0);
      if (serviceRow) {
        const settings = await ensureServiceCatalog();
        tariffAmount = calculateTariffRials(serviceRow, settings);
        if (colleague) {
          const [specificShare] = await db.select().from(collaboratorServiceShares).where(and(
            eq(collaboratorServiceShares.staffId, colleague.id),
            eq(collaboratorServiceShares.serviceId, serviceRow.id),
            eq(collaboratorServiceShares.active, true),
          )).limit(1);
          if (specificShare) {
            shareType = specificShare.shareType;
            shareValue = specificShare.shareValue;
          }
        }
        shareAmount = shareType === "fixed" ? Math.round(shareValue) : Math.round(tariffAmount * shareValue / 100);
      }
      const [row] = await db.insert(referrals).values({
        id: id("REF"), nationalId, colleagueName,
        serviceId: serviceRow?.id ?? null, service: (serviceRow?.title ?? clean(data.service)) || null,
        tariffAmount, shareType, shareValue, shareAmount,
      }).returning();
      await audit(user, "create", "referral", row.id); return Response.json({ record: row }, { status: 201 });
    }

    if (payload.entity === "visit") {
      const patientId = clean(data.patientId), doctor = clean(data.doctor);
      if (!patientId || !doctor) return Response.json({ error: "بیمار و پزشک الزامی است" }, { status: 400 });
      const [row] = await db.insert(clinicalVisits).values({
        id: id("VIS"), patientId, appointmentId: clean(data.appointmentId) || null, doctor,
        chiefComplaint: clean(data.chiefComplaint) || null, diagnosis: clean(data.diagnosis) || null,
        treatment: clean(data.treatment) || null, medications: clean(data.medications) || null,
        followUpAt: clean(data.followUpAt) || null, status: clean(data.status) || "open",
      }).returning();
      await audit(user, "create", "visit", row.id); return Response.json({ record: row }, { status: 201 });
    }

    return Response.json({ error: "نوع رکورد پشتیبانی نمی‌شود" }, { status: 400 });
  } catch (error) {
    if (storageUnavailable(error)) return Response.json({ error: "پایگاه‌داده در حال آماده‌سازی است" }, { status: 503 });
    const message = error instanceof Error && /UNIQUE/i.test(error.message) ? "این کد ملی قبلاً ثبت شده است" : "ذخیره اطلاعات ناموفق بود";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = await request.json() as { entity?: string; id?: string; data?: Record<string, unknown> };
    const permissionEntity = payload.entity === "tariffSetting" ? "service" : payload.entity;
    const user = await authorized(permissionEntity);
    if (!user) return Response.json({ error: "برای این عملیات دسترسی ندارید" }, { status: 403 });
    const recordId = clean(payload.id), data = payload.data ?? {}, db = getDb();
    if (!recordId) return Response.json({ error: "شناسه رکورد الزامی است" }, { status: 400 });
    let row: Record<string, unknown> | undefined;
    if (payload.entity === "service") {
      if (user.role !== "مدیر سیستم") return Response.json({ error: "ویرایش تعرفه فقط برای مدیر سامانه مجاز است" }, { status: 403 });
      const [current] = await db.select().from(medicalServices).where(eq(medicalServices.id, recordId)).limit(1);
      if (current) {
        const professionalValue = data.professionalValue == null ? current.professionalValue : Math.max(0, decimal(data.professionalValue));
        const technicalValue = data.technicalValue == null ? current.technicalValue : Math.max(0, decimal(data.technicalValue));
        [row] = await db.update(medicalServices).set({
          title: clean(data.title) || current.title,
          category: clean(data.category) || current.category,
          feature: data.feature == null ? current.feature : clean(data.feature),
          notes: data.notes == null ? current.notes : clean(data.notes),
          tariffType: clean(data.tariffType) === "outpatient" ? "outpatient" : clean(data.tariffType) === "standard" ? "standard" : current.tariffType,
          professionalValue, technicalValue, totalValue: professionalValue + technicalValue,
          anesthesiaValue: data.anesthesiaValue == null ? current.anesthesiaValue : clean(data.anesthesiaValue) || "0",
          customTariffRials: data.useOfficial === true || data.useOfficial === "true" ? null : (data.customTariffRials == null || clean(data.customTariffRials) === "" ? current.customTariffRials : Math.max(0, number(data.customTariffRials))),
          active: data.active == null ? current.active : data.active === true || data.active === "true",
        }).where(eq(medicalServices.id, recordId)).returning();
      }
    }
    if (payload.entity === "tariffSetting") {
      if (user.role !== "مدیر سیستم") return Response.json({ error: "ویرایش ضرایب فقط برای مدیر سامانه مجاز است" }, { status: 403 });
      const [current] = await db.select().from(tariffSettings).where(eq(tariffSettings.id, recordId)).limit(1);
      if (current) {
        [row] = await db.update(tariffSettings).set({
          standardProfessionalK: Math.max(0, number(data.standardProfessionalK) || current.standardProfessionalK),
          standardTechnicalK: Math.max(0, number(data.standardTechnicalK) || current.standardTechnicalK),
          outpatientProfessionalK: Math.max(0, number(data.outpatientProfessionalK) || current.outpatientProfessionalK),
          outpatientTechnicalK: Math.max(0, number(data.outpatientTechnicalK) || current.outpatientTechnicalK),
        }).where(eq(tariffSettings.id, recordId)).returning();
      }
    }
    if (payload.entity === "lead") [row] = await db.update(crmLeads).set({ stage: clean(data.stage) || "new", nextAction: clean(data.nextAction) || null }).where(eq(crmLeads.id, recordId)).returning();
    if (payload.entity === "medication") {
      const [current] = await db.select().from(medications).where(eq(medications.id, recordId)).limit(1);
      if (current) {
        const update = user.role === "مدیر سیستم" ? {
          name: clean(data.name) || current.name,
          genericName: data.genericName == null ? current.genericName : clean(data.genericName) || null,
          category: data.category == null ? current.category : clean(data.category) || null,
          stock: data.stock == null ? current.stock : Math.max(0, number(data.stock)),
          minStock: data.minStock == null ? current.minStock : Math.max(0, number(data.minStock)),
          unit: clean(data.unit) || current.unit,
          unitPrice: data.unitPrice == null ? current.unitPrice : Math.max(0, number(data.unitPrice)),
          batch: data.batch == null ? current.batch : clean(data.batch) || null,
          expiresAt: data.expiresAt == null ? current.expiresAt : clean(data.expiresAt) || null,
          supplier: data.supplier == null ? current.supplier : clean(data.supplier) || null,
        } : { stock: data.stock == null ? current.stock : Math.max(0, number(data.stock)) };
        [row] = await db.update(medications).set(update).where(eq(medications.id, recordId)).returning();
      }
    }
    if (payload.entity === "patient") [row] = await db.update(patients).set({ status: clean(data.status) || "active" }).where(eq(patients.id, recordId)).returning();
    if (payload.entity === "appointment") [row] = await db.update(appointments).set({ status: clean(data.status) || "scheduled", room: clean(data.room) || null }).where(eq(appointments.id, recordId)).returning();
    if (payload.entity === "referral") [row] = await db.update(referrals).set({ status: clean(data.status) || "registered", shareAmount: Math.max(0, number(data.shareAmount)) }).where(eq(referrals.id, recordId)).returning();
    if (payload.entity === "transaction") [row] = await db.update(financialTransactions).set({ status: clean(data.status) || "paid" }).where(eq(financialTransactions.id, recordId)).returning();
    if (!row) return Response.json({ error: "رکورد یا نوع عملیات پیدا نشد" }, { status: 404 });
    await audit(user, "update", payload.entity ?? "unknown", recordId, data);
    return Response.json({ record: row });
  } catch (error) {
    if (storageUnavailable(error)) return Response.json({ error: "پایگاه‌داده در حال آماده‌سازی است" }, { status: 503 });
    return Response.json({ error: "به‌روزرسانی اطلاعات ناموفق بود" }, { status: 500 });
  }
}
