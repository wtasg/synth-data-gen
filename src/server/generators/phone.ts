import { loadDataset } from "../datasets/loader.ts";
import type { Generator, PhonePlan, PhoneRequest, PhoneResponse } from "../models/types.ts";
import type { GenerationContext } from "../random/prng.ts";
import { normalizeCountry } from "../utils/country.ts";
import { createTextPredicate } from "../utils/text_filters.ts";
import { chooseRecord, formatNoMatch, resolveContext } from "./shared.ts";

function digits(length: number, context: GenerationContext): string {
  let value = "";
  for (let index = 0; index < length; index += 1) {
    value += String(context.rng.int(10));
  }
  return value;
}

export class PhoneGenerator implements Generator<PhoneRequest, PhoneResponse> {
  async generate(
    request: PhoneRequest,
    context?: GenerationContext,
  ): Promise<PhoneResponse> {
    const country = normalizeCountry(request.country) ?? "US";
    const plans = await loadDataset<PhonePlan[]>("phone/plans.json");
    const plan = chooseRecord(
      plans.filter((entry) => entry.country === country),
      resolveContext(request.seed, context),
    );
    const resolvedContext = resolveContext(request.seed, context);
    const predicate = createTextPredicate(request);

    for (let attempt = 0; attempt < 200; attempt += 1) {
      const prefix = plan.prefixes[resolvedContext.rng.int(plan.prefixes.length)];
      const suffixLength = plan.nationalLength - prefix.length;
      const nationalNumber = `${prefix}${digits(suffixLength, resolvedContext)}`;
      if (predicate(nationalNumber)) {
        return {
          countryCode: plan.countryCode,
          nationalNumber,
          international: `${plan.countryCode} ${nationalNumber}`,
        };
      }
    }

    formatNoMatch(
      `No phone number matches pattern '${request.wildcard ?? request.startsWith ?? request.exact ?? "*"}'.`,
    );
  }
}