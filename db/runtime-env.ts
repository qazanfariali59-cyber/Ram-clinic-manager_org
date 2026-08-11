import { AsyncLocalStorage } from "node:async_hooks";

export interface ClinicRuntimeEnv {
  DB?: D1Database;
}

const key = Symbol.for("ram-clinic.runtime-env");
const registry = globalThis as typeof globalThis & {
  [key]?: AsyncLocalStorage<ClinicRuntimeEnv>;
};

const runtimeEnv = registry[key] ??= new AsyncLocalStorage<ClinicRuntimeEnv>();

export function runWithClinicEnv<T>(env: ClinicRuntimeEnv, work: () => T): T {
  return runtimeEnv.run(env, work);
}

export function getClinicEnv() {
  return runtimeEnv.getStore();
}
