export function normalizeCountry(country?: string): string | undefined {
  return country?.trim().toUpperCase();
}

export function localeForCountry(country?: string): string {
  const normalized = normalizeCountry(country);
  switch (normalized) {
    case "IN":
      return "hi";
    case "FR":
      return "fr";
    default:
      return "en";
  }
}