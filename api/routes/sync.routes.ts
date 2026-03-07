export function registerSyncRoutes(): string[] {
  return ["POST /sync/handshake", "POST /sync/delta"];
}
