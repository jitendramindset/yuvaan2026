import { kernelConfig } from "../../config/kernel.config.js";

const subsystems = new Map<string, boolean>();

export function register(name: string): void {
  subsystems.set(name, true);
}

export function getAll(): Map<string, boolean> {
  return subsystems;
}

function init(): void {
  register("node.loader");
  register("node.executor");
  register("permission.engine");
  register("log.engine");
  register("workflow.engine");
  register("hash.engine");

  if (kernelConfig.enforcePermissions) {
    register("permission.enforcement");
  }
}

init();
