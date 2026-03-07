export function buildKey(partition: string, id: string): string {
  return `${partition}:${id}`;
}
