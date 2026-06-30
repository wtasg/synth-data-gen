import type { BaseRequest, LengthRange } from "../models/types.ts";
import { createContainsMatcher } from "../filters/contains.ts";
import { createEndsWithMatcher } from "../filters/endsWith.ts";
import { createStartsWithMatcher } from "../filters/startsWith.ts";
import { createWildcardMatcher } from "../filters/wildcard.ts";

function toMatcher(
  value: string,
  caseSensitive: boolean,
): (candidate: string) => boolean {
  if (value.includes("*")) {
    return createWildcardMatcher(value, caseSensitive);
  }

  return createStartsWithMatcher(value, caseSensitive);
}

export function matchesLength(value: string, length?: LengthRange): boolean {
  if (!length) {
    return true;
  }
  if (length.min !== undefined && value.length < length.min) {
    return false;
  }
  if (length.max !== undefined && value.length > length.max) {
    return false;
  }
  return true;
}

export function createTextPredicate(
  request: Pick<
    BaseRequest,
    | "startsWith"
    | "endsWith"
    | "contains"
    | "wildcard"
    | "exact"
    | "caseSensitive"
    | "length"
  >,
): (value: string) => boolean {
  const caseSensitive = request.caseSensitive ?? false;
  const matchers: Array<(value: string) => boolean> = [];

  if (request.startsWith) {
    matchers.push(toMatcher(request.startsWith, caseSensitive));
  }
  if (request.endsWith) {
    matchers.push(createEndsWithMatcher(request.endsWith, caseSensitive));
  }
  if (request.contains) {
    matchers.push(createContainsMatcher(request.contains, caseSensitive));
  }
  if (request.wildcard) {
    matchers.push(createWildcardMatcher(request.wildcard, caseSensitive));
  }
  if (request.exact) {
    matchers.push(
      caseSensitive
        ? (value: string) => value === request.exact
        : (value: string) => value.toLowerCase() === request.exact!.toLowerCase(),
    );
  }

  return (value: string) =>
    matchesLength(value, request.length) &&
    matchers.every((matcher) => matcher(value));
}