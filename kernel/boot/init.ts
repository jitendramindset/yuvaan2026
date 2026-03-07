import { getAll } from "./subsystem_registry.js";

export async function init(): Promise<void> {
  const subsystems = getAll();
  const count = subsystems.size;
  process.stdout.write(`[kernel:boot] Registered ${count} subsystems\n`);
  for (const [name] of subsystems) {
    process.stdout.write(`  ✓ ${name}\n`);
  }
  process.stdout.write("[kernel:boot] Kernel ready\n");
}
