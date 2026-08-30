# RAM Clinic Manager — Operations Integration v13

This checkpoint extends the open `sites/patient-timeline-v12` work without changing `main` or the current Cloudflare production configuration.

## Scope

- Keep D1 as the operational source of truth.
- Keep RAM AI read-only for operational recommendations unless an explicit, audited action is approved later.
- Use Close only for non-clinical CRM entities such as referral sources, partner clinics, physicians, lead status, follow-up tasks, and outreach history.
- Do not sync diagnosis, treatment notes, medications, national ID, patient phone number, or other clinical/identity data to Close.
- Add analytics on aggregated clinic data: visits, referrals, conversion, revenue, receivables, collaborator share, service mix, cancellation/no-show, and low-stock consumables.
- Preserve role isolation from PR #9: manager sees all, external colleague sees only own referrals, patient sees only own timeline.
- Model each physician as an individual referral source with a configurable procedure-capability profile. Do not assume all orthopedists or surgeons refer the same cases.

## Physician-specific referral model

A core business assumption is that an orthopedist, neurosurgeon, spine surgeon, sports-medicine physician, or other surgeon may personally perform only a limited subset of procedures and refer the remaining appropriate cases to RAM.

For each external physician, keep a service matrix with four states:

1. `self_performed` — the physician usually performs this procedure personally and should not be treated as a normal referral opportunity for it.
2. `refers_to_ram` — the physician is willing or expected to refer suitable cases for this service to RAM.
3. `case_by_case` — referral depends on patient, facility, insurance, complexity, availability, or physician preference.
4. `not_relevant` — the service is outside the physician's typical case mix.

The profile must be editable per physician and per RAM service. Suggested internal fields:

- `staff_id` / external physician ID;
- specialty and subspecialty;
- RAM `service_id`;
- procedure relationship state;
- confidence/source of the classification (`physician_confirmed`, `manager_observed`, `referral_history`, `unknown`);
- optional estimated eligible case volume, only when explicitly entered or supported by observed aggregate data;
- last reviewed date;
- notes about non-patient-specific referral preferences or facility limitations.

This matrix belongs in Clinic D1. Close may receive only non-clinical segmentation labels such as `Spine referrer`, `Joint procedures self-performed`, or `High potential for RF referrals`; no patient-level data should be sent.

### Referral opportunity logic

Referral potential must be calculated from the physician's **addressable gap**, not from all RAM services.

For example, if an orthopedist performs intra-articular injections personally but does not perform epidural injections, radiofrequency procedures, vertebral augmentation, or advanced image-guided pain interventions, RAM should score and follow up only on the latter group when clinically and operationally relevant.

Recommended derived measures:

- addressable services per physician;
- actual referrals by addressable service;
- conversion rate of those referrals;
- revenue and collaborator share from addressable referrals;
- dormant addressable services: services marked `refers_to_ram` or `case_by_case` with no recent referrals;
- referral concentration: whether a physician sends only one procedure type despite having several addressable service categories;
- referral opportunity index, calculated only when enough explicit or observed data exists. Never invent case volumes.

RAM AI should use this matrix when suggesting outreach. It should not recommend marketing a procedure to a physician who already performs that procedure unless the manager explicitly wants a co-management or overflow strategy.

## Proposed integration boundary

### Clinic D1
Primary database for patients, appointments, clinical visits, transactions, medical services, referrals, users, tariffs, audit logs, and the physician-to-service referral capability matrix.

### Close CRM
Use for:
- referral-source organizations;
- physicians and partner clinics;
- outreach leads;
- follow-up tasks;
- referral relationship stage;
- non-patient relationship notes;
- broad physician segments derived from the D1 procedure profile.

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
- physician-specific addressable procedure gaps;
- service mix and capacity;
- revenue and outstanding balances;
- appointment conversion and cancellations;
- low-stock alerts.

No direct write actions should be enabled until every action has role checks, a confirmation step, and an audit-log entry.

## Manager UX for referral network

Each external physician profile should show a compact procedure map rather than one generic `referrer` label:

- **Does personally** — procedures usually kept in the physician's own practice.
- **Refers to RAM** — primary target services for referral relationship management.
- **Case by case** — potentially addressable but not automatic.
- **Not relevant** — excluded from outreach and opportunity calculations.

The manager should be able to bulk-copy a specialty template when creating a physician, then override it service by service. Templates are only starting points and must never replace the physician-specific profile.

The dashboard should answer practical questions such as:

- Which orthopedists have the largest unaddressed referral opportunity for spine interventions?
- Which surgeons refer injections but not RF despite RF being in their addressable profile?
- Which physicians are active referrers for one service but dormant for other services they previously referred?
- Which referral sources generate the best conversion and net revenue within the procedures they actually refer?

## Safety rules

1. Never send patient national IDs, phone numbers, names, diagnoses, treatment notes, or medication data to Close.
2. Never expose the Worker publicly until Cloudflare Access is configured and tested.
3. Keep `workers_dev` and preview URLs disabled for the production Worker.
4. Test CRM integration using synthetic partner/referral-source data first.
5. All future AI writes must be explicit, reversible where possible, and logged.
6. Do not infer that a physician performs or refers a procedure solely from specialty. Use templates only as editable defaults; prefer confirmed or observed physician-level data.
7. Do not expose one physician's referral economics, case mix, or procedure profile to another external colleague.

## Current connector status

The connected Close workspace is readable and currently has no leads. Its default lead statuses are visible, but the active connector scope does not permit status updates, so no remote CRM configuration was changed from ChatGPT.

## Next implementation slice

- Add a `physician_service_profiles` table linking each external physician to RAM services with the four-state referral relationship.
- Add manager UI for the per-physician procedure matrix and specialty templates with physician-level overrides.
- Update referral analytics so denominators and opportunity calculations use only each physician's addressable services.
- Add an internal CRM sync endpoint for referral-source metadata and broad segmentation only.
- Add a mapping table between `staff` external collaborators and Close lead IDs.
- Add an analytics endpoint that returns aggregated KPIs without patient-identifying fields.
- Add a manager dashboard section for referral conversion, physician-specific opportunity gaps, revenue per service, outstanding balances, and low-stock alerts.
- Update RAM AI prompts/read models to distinguish `self_performed`, `refers_to_ram`, `case_by_case`, and `not_relevant` services for each physician.
- Add explicit feature flags so Close sync and future AI write actions default to OFF.
