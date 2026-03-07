export function verifyAuth(token?: string): boolean {
  return Boolean(token && token.length > 0);
}
