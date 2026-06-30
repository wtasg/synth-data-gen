import { loadDataset } from "../datasets/loader.ts";
import type {
  AddressRequest,
  AddressResponse,
  Generator,
  PostalRecord,
} from "../models/types.ts";
import type { GenerationContext } from "../random/prng.ts";
import { normalizeCountry } from "../utils/country.ts";
import { createTextPredicate } from "../utils/text_filters.ts";
import { chooseRecord, chooseValue, formatNoMatch, resolveContext } from "./shared.ts";

function equalsIgnoreCase(left: string, right?: string): boolean {
  return right === undefined || left.toLowerCase() === right.toLowerCase();
}

export class AddressGenerator implements Generator<AddressRequest, AddressResponse> {
  async generate(
    request: AddressRequest,
    context?: GenerationContext,
  ): Promise<AddressResponse> {
    const country = normalizeCountry(request.country) ?? "US";
    const postalRecords = await loadDataset<PostalRecord[]>(`postal/${country.toLowerCase()}.json`);
    const streetNames = await loadDataset<string[]>(`streets/${country.toLowerCase()}.json`);
    const predicate = createTextPredicate({
      startsWith: request.pin ?? request.startsWith,
      wildcard: request.wildcard,
      exact: request.postalCode ?? request.exact,
      endsWith: request.endsWith,
      contains: request.contains,
      caseSensitive: request.caseSensitive,
      length: request.length,
    });

    const matches = postalRecords.filter((entry) => {
      if (!equalsIgnoreCase(entry.state, request.state)) {
        return false;
      }
      if (!equalsIgnoreCase(entry.city, request.city)) {
        return false;
      }
      if (!equalsIgnoreCase(entry.district, request.district)) {
        return false;
      }
      return predicate(entry.postalCode);
    });

    if (matches.length === 0) {
      formatNoMatch(
        `No address matches postal filter '${request.pin ?? request.postalCode ?? request.wildcard ?? "*"}'.`,
      );
    }

    const resolvedContext = resolveContext(request.seed, context);
    const postal = chooseRecord(matches, resolvedContext);
    const street = chooseValue(streetNames, resolvedContext);
    const area = chooseValue(postal.areas, resolvedContext);
    const houseNumber = String(1 + resolvedContext.rng.int(9999));

    return {
      houseNumber,
      street,
      area,
      city: postal.city,
      district: postal.district,
      state: postal.state,
      country: postal.country,
      postalCode: postal.postalCode,
    };
  }
}