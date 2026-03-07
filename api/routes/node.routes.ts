export function registerNodeRoutes(): string[] {
  return ["GET /nodes/:id", "POST /nodes", "PATCH /nodes/:id", "DELETE /nodes/:id"];
}
