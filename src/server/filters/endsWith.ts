export function createEndsWithMatcher(
  suffix: string,
  caseSensitive = false,
): (value: string) => boolean {
  if (caseSensitive) {
    return (value: string) => value.endsWith(suffix);
  }

  const expected = suffix.toLowerCase();
  return (value: string) => value.toLowerCase().endsWith(expected);
}