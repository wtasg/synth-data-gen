export function createContainsMatcher(
  fragment: string,
  caseSensitive = false,
): (value: string) => boolean {
  if (caseSensitive) {
    return (value: string) => value.includes(fragment);
  }

  const expected = fragment.toLowerCase();
  return (value: string) => value.toLowerCase().includes(expected);
}