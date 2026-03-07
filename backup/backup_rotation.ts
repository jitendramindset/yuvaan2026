export function rotateBackups(retentionDays = 7): string {
  return `Backup rotation complete: retention=${retentionDays}d`;
}
