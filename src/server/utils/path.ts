export function normalizePathname(pathname: string): string {
  const normalized = pathname.replace(/\/{2,}/g, "/");
  return normalized.length > 1 && normalized.endsWith("/")
    ? normalized.slice(0, -1)
    : normalized;
}