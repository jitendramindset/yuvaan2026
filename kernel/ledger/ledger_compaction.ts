import { promises as fs } from "node:fs";
import path from "node:path";

export async function compactLedger(
  logFile: string,
  maxLines = 10000,
): Promise<void> {
  try {
    const raw = await fs.readFile(logFile, "utf8");
    const lines = raw.split("\n").filter(Boolean);
    if (lines.length > maxLines) {
      const kept = lines.slice(lines.length - maxLines);
      await fs.writeFile(logFile, kept.join("\n") + "\n", "utf8");
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      throw err;
    }
    await fs.mkdir(path.dirname(logFile), { recursive: true });
  }
}
