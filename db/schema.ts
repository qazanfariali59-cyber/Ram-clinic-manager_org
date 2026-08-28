import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const createdAt = text("created_at")
  .notNull()
  .default(sql`CURRENT_TIMESTAMP`);

export const patients = sqliteTable("patients", {
  id: text("id").primaryKey(),
  nationalId: text("national_id").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  birthDate: text("birth_date"),
  gender: text("gender"),
  city: text("city"),
  service: text("service"),
  doctor: text("doctor"),
  status: text("status").notNull().default("active"),
  tags: text("tags").notNull().default("[]"),
  balance: integer("balance").notNull().default(0),
  createdAt,
});

export const staff = sqliteTable("staff", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  personnelType: text("personnel_type").notNull(),
  role: text("role").notNull(),
  specialty: text("specialty"),
  phone: text("phone"),
  shift: text("shift"),
  status: text("status").notNull().default("active"),
  revenueShare: integer("revenue_share").notNull().default(0),
  createdAt,
});

export const crmLeads = sqliteTable("crm_leads", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  source: text("source"),
  service: text("service"),
  owner: text("owner"),
  stage: text("stage").notNull().default("new"),
  nextAction: text("next_action"),
  nextActionAt: text("next_action_at"),
  value: integer("value").notNull().default(0),
  notes: text("notes"),
  createdAt,
});

export const medications = sqliteTable("medications", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  genericName: text("generic_name"),
  category: text("category"),
  stock: integer("stock").notNull().default(0),
  minStock: integer("min_stock").notNull().default(5),
  unit: text("unit").notNull().default("عدد"),
  unitPrice: integer("unit_price").notNull().default(0),
  batch: text("batch"),
  expiresAt: text("expires_at"),
  supplier: text("supplier"),
  createdAt,
});

export const referrals = sqliteTable("referrals", {
  id: text("id").primaryKey(),
  nationalId: text("national_id").notNull(),
  colleagueName: text("colleague_name").notNull(),
  serviceId: text("service_id"),
  service: text("service"),
  status: text("status").notNull().default("registered"),
  tariffAmount: integer("tariff_amount").notNull().default(0),
  shareType: text("share_type").notNull().default("percentage"),
  shareValue: real("share_value").notNull().default(0),
  shareAmount: integer("share_amount").notNull().default(0),
  createdAt,
});

export const medicalServices = sqliteTable("medical_services", {
  id: text("id").primaryKey(),
  nationalCode: text("national_code").notNull().unique(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  feature: text("feature").notNull().default(""),
  notes: text("notes").notNull().default(""),
  tariffType: text("tariff_type").notNull().default("standard"),
  totalValue: real("total_value").notNull().default(0),
  professionalValue: real("professional_value").notNull().default(0),
  technicalValue: real("technical_value").notNull().default(0),
  anesthesiaValue: text("anesthesia_value").notNull().default("0"),
  customTariffRials: integer("custom_tariff_rials"),
  sourceYear: integer("source_year").notNull().default(1405),
  sourceTitle: text("source_title").notNull(),
  sourceUrl: text("source_url").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt,
});

export const tariffSettings = sqliteTable("tariff_settings", {
  id: text("id").primaryKey(),
  year: integer("year").notNull().unique(),
  standardProfessionalK: integer("standard_professional_k").notNull(),
  standardTechnicalK: integer("standard_technical_k").notNull(),
  outpatientProfessionalK: integer("outpatient_professional_k").notNull(),
  outpatientTechnicalK: integer("outpatient_technical_k").notNull(),
  sector: text("sector").notNull().default("private"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt,
});

export const collaboratorServiceShares = sqliteTable("collaborator_service_shares", {
  id: text("id").primaryKey(),
  staffId: text("staff_id").notNull(),
  serviceId: text("service_id").notNull(),
  shareType: text("share_type").notNull().default("percentage"),
  shareValue: real("share_value").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt,
}, (table) => [
  uniqueIndex("collaborator_service_share_unique").on(table.staffId, table.serviceId),
]);

export const userAccounts = sqliteTable("user_accounts", {
  id: text("id").primaryKey(), email: text("email").notNull().unique(), displayName: text("display_name").notNull(),
  role: text("role").notNull().default("پذیرش"), colleagueName: text("colleague_name"), patientId: text("patient_id"),
  status: text("status").notNull().default("active"), createdAt,
});

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(), actorEmail: text("actor_email").notNull(), actorRole: text("actor_role").notNull(),
  action: text("action").notNull(), entity: text("entity").notNull(), entityId: text("entity_id"),
  details: text("details").notNull().default("{}"), createdAt,
});

export const appointments = sqliteTable("appointments", {
  id: text("id").primaryKey(), patientId: text("patient_id"), patientName: text("patient_name").notNull(),
  nationalId: text("national_id"), date: text("date").notNull(), time: text("time").notNull(),
  doctor: text("doctor").notNull(), service: text("service").notNull(), room: text("room"),
  status: text("status").notNull().default("scheduled"), notes: text("notes"), createdAt,
});

export const financialTransactions = sqliteTable("financial_transactions", {
  id: text("id").primaryKey(), patientId: text("patient_id"), counterparty: text("counterparty").notNull(),
  category: text("category").notNull(), description: text("description").notNull(), amount: integer("amount").notNull(),
  paymentMethod: text("payment_method"), status: text("status").notNull().default("paid"),
  referenceId: text("reference_id"), createdAt,
});

export const clinicalVisits = sqliteTable("clinical_visits", {
  id: text("id").primaryKey(), patientId: text("patient_id").notNull(), appointmentId: text("appointment_id"),
  doctor: text("doctor").notNull(), chiefComplaint: text("chief_complaint"), diagnosis: text("diagnosis"),
  treatment: text("treatment"), medications: text("medications"), followUpAt: text("follow_up_at"),
  status: text("status").notNull().default("open"), createdAt,
});
