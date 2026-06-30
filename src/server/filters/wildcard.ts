function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function wildcardToRegExp(
  pattern: string,
  caseSensitive = false,
): RegExp {
  const source = `^${escapeRegExp(pattern).replace(/\\\*/g, ".*")}$`;
  return new RegExp(source, caseSensitive ? "" : "i");
}

export function createWildcardMatcher(
  pattern: string,
  caseSensitive = false,
): (value: string) => boolean {
  const expression = wildcardToRegExp(pattern, caseSensitive);
  return (value: string) => expression.test(value);
}