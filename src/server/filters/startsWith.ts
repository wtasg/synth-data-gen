export function createStartsWithMatcher(
  prefix: string,
  caseSensitive = false,
): (value: string) => boolean {
  if (caseSensitive) {
    return (value: string) => value.startsWith(prefix);
  }

  const expected = prefix.toLowerCase();
  return (value: string) => value.toLowerCase().startsWith(expected);
}