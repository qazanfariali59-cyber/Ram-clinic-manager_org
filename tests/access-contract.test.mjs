import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const accessSource = await readFile(new URL("../app/access.ts", import.meta.url), "utf8");
const apiSource = await readFile(new URL("../app/api/clinic/route.ts", import.meta.url), "utf8");

test("patient and external-referrer access remain isolated", () => {
  assert.match(accessSource, /"بیمار": \["patientPortal"\]/);
  assert.match(accessSource, /"همکار بیرونی": \["referral", "service"\]/);
  assert.match(apiSource, /where\(eq\(patients\.id, user\.patientId\)\)/);
  assert.match(apiSource, /where\(eq\(clinicalVisits\.patientId, user\.patientId\)\)/);
  assert.match(apiSource, /user\.role === "همکار بیرونی"[\s\S]*nationalId: `\$\{row\.nationalId\.slice\(0, 3\)\}•••••••`/);
});

test("interactive records are explicitly synthetic", () => {
  assert.match(apiSource, /payload\.entity === "demoSeed"/);
  assert.match(apiSource, /بیمار نمونه/);
  assert.match(apiSource, /synthetic: true/);
});
