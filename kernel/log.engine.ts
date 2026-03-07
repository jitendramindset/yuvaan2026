import { promises as fs } from "node:fs";
import path from "node:path";
import { LOG_FILE } from "../shared/constants.js";

export interface NodeLogEvent {
  event_id: string;
  node_id: string;
  action: string;
  timestamp: string;
  result: string;
  device_id: string;
}

async function ensureLogFile(filePath = LOG_FILE): Promise<void> {
  try {
    await fs.access(filePath);
  } catch {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, "[]\n", "utf8");
  }
}

export async function appendLog(event: NodeLogEvent, filePath = LOG_FILE): Promise<void> {
  await ensureLogFile(filePath);
  const raw = await fs.readFile(filePath, "utf8");
  const current = (JSON.parse(raw) as NodeLogEvent[]) ?? [];
  current.push(event);
  await fs.writeFile(filePath, `${JSON.stringify(current, null, 2)}\n`, "utf8");
}
