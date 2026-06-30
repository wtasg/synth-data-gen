import { loadDataset } from "../datasets/loader.ts";
import type { FirstNameRequest, Generator, NameRecord, ValueResponse } from "../models/types.ts";
import type { GenerationContext } from "../random/prng.ts";
import { localeForCountry } from "../utils/country.ts";
import { createTextPredicate } from "../utils/text_filters.ts";
import { chooseRecord, formatNoMatch, resolveContext } from "./shared.ts";

export class FirstNameGenerator implements Generator<FirstNameRequest, ValueResponse> {
  async generate(
    request: FirstNameRequest,
    context?: GenerationContext,
  ): Promise<ValueResponse> {
    const locale = request.locale ?? localeForCountry(request.country);
    const dataset = await loadDataset<NameRecord[]>(`firstname/${locale}.json`).catch(() =>
      loadDataset<NameRecord[]>("firstname/en.json")
    );

    const predicate = createTextPredicate(request);
    const candidates = dataset.filter((entry) => {
      if (request.gender && request.gender !== "any" && entry.gender !== request.gender) {
        return false;
      }
      if (request.country && entry.country && !entry.country.includes(request.country.toUpperCase())) {
        return false;
      }
      return predicate(entry.value);
    });

    if (candidates.length === 0) {
      formatNoMatch(
        `No first name matches pattern '${request.wildcard ?? request.startsWith ?? request.exact ?? "*"}'.`,
      );
    }

    const selected = chooseRecord(candidates, resolveContext(request.seed, context));
    return { value: selected.value };
  }
}