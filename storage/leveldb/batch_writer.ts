export function batchWrite(
  _db: unknown,
  entries: Array<{ key: string; value: string }>,
): string {
  return `BatchWrite scheduled: ${entries.length} entries`;
}
