export function registerDeviceRoutes(): string[] {
  return ["POST /devices/register", "POST /devices/revoke"];
}
