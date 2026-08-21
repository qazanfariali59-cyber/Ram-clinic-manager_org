# Cloudflare canary deployment runbook

This runbook is the gate for RAM's first Cloudflare Workers + D1 deployment. It deliberately targets resources that cannot overlap with the current production names:

- Worker: `ram-clinic-manager-canary`
- D1 database: `ram-clinic-manager-canary-db`
- GitHub Environment: `cloudflare-canary`
- Public `workers.dev` route: disabled
- Preview URLs: disabled
- `OPENAI_API_KEY`: intentionally omitted from the first canary

The first deployed Worker is therefore unreachable from the public Internet. Configure Cloudflare Access and an approved route only after the isolated deployment and database checks pass.

## Repository status verified on 2026-08-21

- PR #5 is merged and `main` is at `2156c3bf22a7617f20a564540a02bc1866696700`.
- The previous workflow was manual-only, but it targeted `ram-clinic-manager`, used production-labelled concurrency, and relied on the generic `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets.
- The checked-in production `wrangler.jsonc` names `ram-clinic-manager`, enables preview URLs, and does not include a D1 `database_name` or `database_id`.
- `vinext` is pinned to `0.0.50`, Wrangler to `4.92.0`, and Node to `>=22.13.0`.
- The PR #5 validation run passed install, lint, and build.
- Four D1 migrations exist under `drizzle/`; they create or alter clinic tables and do not contain `DROP` or `DELETE` statements.
- GitHub does not expose secret values. The repository contents and available metadata do not prove whether the three old generic secrets are present.
- `main` is not branch-protected, and the old deployment job did not use a GitHub Environment approval gate.
- On an empty `user_accounts` table, the first accepted identity becomes `مدیر سیستم`. Do not make the canary public before Cloudflare Access and the initial administrator are deliberately configured.

## Why the old workflow must not be the first run

Wrangler `4.92.0` does not reliably carry an automatically provisioned D1 ID into the following CI migration command. The old sequence could create the Worker and D1, then fail while applying migrations, leaving a partial deployment. Also, `vinext deploy --name` does not override an already-present Wrangler config, so changing only that flag is not sufficient isolation.

The replacement workflow avoids both problems: it requires a pre-created D1 with an explicit UUID, verifies the remote name and UUID before migrations, validates the generated deploy config, and deploys a fixed canary Worker with no public route.

## One-time setup checklist

Prefer a separate free Cloudflare account for this canary. If that is not practical, use the same account only with the fixed canary names below and a token scoped to that account.

- [ ] Create D1 database `ram-clinic-manager-canary-db` in the canary account.
- [ ] Record its UUID from the Cloudflare dashboard or `npx wrangler d1 info ram-clinic-manager-canary-db`.
- [ ] Create a Cloudflare API token scoped only to the canary account with `Workers Scripts: Edit` and `D1: Edit`. Do not grant zone permissions because this workflow creates no route.
- [ ] In GitHub, create Environment `cloudflare-canary`.
- [ ] Add a required reviewer to that Environment before adding credentials. The workflow verifies this rule and fails if it is missing.
- [ ] If a second trusted reviewer is available, enable **Prevent self-review** and disable administrator bypass.
- [ ] Add Environment secret `CLOUDFLARE_CANARY_API_TOKEN`.
- [ ] Add Environment secret `CLOUDFLARE_CANARY_ACCOUNT_ID`.
- [ ] Add Environment secret `CLOUDFLARE_CANARY_D1_DATABASE_ID`.
- [ ] Do not add `OPENAI_API_KEY` for the first deployment.
- [ ] Review and merge the canary-safety PR. Do not run the retired production-labelled workflow.

## First execution: read-only preflight

Run **Deploy RAM canary to Cloudflare** from `main` with:

- `action`: `preflight`
- `confirmation`: blank
- `allow_existing_canary`: off

Expected result: install, lint, build, Wrangler dry-run, D1 identity check, pending migration listing, and Worker-existence check. No Cloudflare resource is created or changed.

Stop if the workflow reports that the canary Worker already exists, the D1 name/UUID does not match, the generated Worker name differs, or either public URL setting is enabled.

## Second execution: isolated first deployment

After the read-only run succeeds, run the same workflow from `main` with:

- `action`: `deploy-canary`
- `confirmation`: `DEPLOY_RAM_CANARY`
- `allow_existing_canary`: off

The workflow applies migrations to the verified canary D1, deploys only `ram-clinic-manager-canary`, and then confirms that both `workers.dev` and preview URLs remain disabled. It never references the old production Worker name or an OpenAI key.

## Before making the canary reachable

- [ ] Configure Cloudflare Access for the intended hostname and allow only named test users.
- [ ] Decide and verify which test identity will become the initial `مدیر سیستم` account.
- [ ] Enable a canary-only hostname or route; do not attach a production hostname.
- [ ] Test with synthetic clinic data only.
- [ ] Verify `/api/health` reports the expected D1 binding and AI disabled.
- [ ] Add `OPENAI_API_KEY` only after core flows and Access controls pass.
- [ ] Keep production deployment as a separate, later PR with its own protected GitHub Environment and explicit D1 ID.

For a later rerun that intentionally updates an already-created canary Worker, set `allow_existing_canary` on only after inspecting the existing resource. Keep it off for the first deployment.
