export function registerBlobRoutes(): string[] {
  return ["POST /blobs", "GET /blobs/:hash"];
}
