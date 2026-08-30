# RAM Clinic Manager — Operations Integration v13

This checkpoint extends the open `sites/patient-timeline-v12` work without changing `main` or the current Cloudflare production configuration.

## Scope

- Keep D1 as the operational source of truth.
- Keep RAM AI read-only for operational recommendations unless an explicit, audited action is approved later.
- Use Close only for non-clinical CRM entities such as referral sources, partner clinics, physicians, lead status, follow-up tasks, and outreach history.
- Do not sync diagnosis, treatment notes, medications, national ID, patient phone number, or other clinical/identity data to Close.
- Add analytics on aggregated clinic data: visits, referrals, conversion, revenue, receivables, collaborator share, service mix, cancellation/no-show, and low-stock consumables.
- Preserve role isolation from PR #9: manager sees all, external colleague sees only own referrals, patient sees only own timeline.

## Proposed integration boundary

### Clinic D1
Primary database for patients, appointments, clinical visits, transactions, medical services, referrals, users, tariffs, and audit logs.

### Close CRM
Use for:
- referral-source organizations;
- physicians and partner clinics;
- outreach leads;
- follow-up tasks;
- referral relationship stage;
- relationship notes that contain no patient identifiers.

Suggested pipeline:
1. New referral source
2. Contacted
3. Interested
4. Qualified partner
5. Active referrer
6. Dormant
7. Not interested

### RAM AI
Use aggregated operational snapshots only. Recommended read models:
- daily operations summary;
- referral source performance;
- service mix and capacity;
- revenue and outstanding balances;
- appointment conversion and cancellations;
- low-stock alerts.

No direct write actions should be enabled until every action has role checks, a confirmation step, and an audit-log entry.

## Safety rules

1. Never send patient national IDs, phone numbers, names, diagnoses, treatment notes, or medication data to Close.
2. Never expose the Worker publicly until Cloudflare Access is configured and tested.
3. Keep `workers_dev` and preview URLs disabled for the production Worker.
4. Test CRM integration using synthetic partner/referral-source data first.
5. All future AI writes must be explicit, reversible where possible, and logged.

## Current connector status

The connected Close workspace is readable and currently has no leads. Its default lead statuses are visible, but the active connector scope does not permit status updates, so no remote CRM configuration was changed from ChatGPT.

## Next implementation slice

- Add an internal CRM sync endpoint for referral-source metadata only.
- Add a mapping table between `staff` external collaborators and Close lead IDs.
- Add an analytics endpoint that returns aggregated KPIs without patient-identifying fields.
- Add a manager dashboard section for referral conversion, revenue per service, outstanding balances, and low-stock alerts.
- Add explicit feature flags so Close sync and future AI write actions default to OFF.
