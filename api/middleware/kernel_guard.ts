export function assertKernelMutable(pathname: string): void {
  if (pathname.startsWith("/kernel")) {
    throw new Error("Kernel area is immutable via public API");
  }
}
