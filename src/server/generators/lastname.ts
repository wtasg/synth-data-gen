import { loadDataset } from "../datasets/loader.ts";
import type { Generator, LastNameRequest, NameRecord, ValueResponse } from "../models/types.ts";
import type { GenerationContext } from "../random/prng.ts";
import { createTextPredicate } from "../utils/text_filters.ts";
import { chooseRecord, formatNoMatch, resolveContext } from "./shared.ts";

export class LastNameGenerator implements Generator<LastNameRequest, ValueResponse> {
  async generate(
    request: LastNameRequest,
    context?: GenerationContext,
  ): Promise<ValueResponse> {
    const dataset = await loadDataset<NameRecord[]>("lastname/en.json");
    const predicate = createTextPredicate(request);
    const candidates = dataset.filter((entry) => predicate(entry.value));

    if (candidates.length === 0) {
      formatNoMatch(
        `No last name matches pattern '${request.wildcard ?? request.startsWith ?? request.exact ?? "*"}'.`,
      );
    }

    const selected = chooseRecord(candidates, resolveContext(request.seed, context));
    return { value: selected.value };
  }
}