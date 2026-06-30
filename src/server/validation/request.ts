import type {
  AddressRequest,
  BatchDatasetRequest,
  BatchGeneratorId,
  BaseRequest,
  FirstNameRequest,
  FullNameRequest,
  Gender,
  LastNameRequest,
  LengthRange,
  PersonRequest,
  PhoneRequest,
} from "../models/types.ts";
import { ServiceError } from "./errors.ts";

const batchGeneratorIds = new Set<BatchGeneratorId>([
  "firstname",
  "lastname",
  "fullname",
  "person",
  "address",
  "phone",
]);

const supportedFields = new Set([
  "seed",
  "locale",
  "country",
  "state",
  "city",
  "district",
  "postalCode",
  "pin",
  "gender",
  "age",
  "minAge",
  "maxAge",
  "startsWith",
  "endsWith",
  "contains",
  "wildcard",
  "exact",
  "length",
  "caseSensitive",
  "middleName",
  "surnameCount",
]);

function ensureObject(body: unknown): Record<string, unknown> {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new ServiceError(400, "INVALID_REQUEST", "Request body must be a JSON object.");
  }
  return body as Record<string, unknown>;
}

function assertSupportedFields(body: Record<string, unknown>): void {
  for (const key of Object.keys(body)) {
    if (!supportedFields.has(key)) {
      throw new ServiceError(
        400,
        "UNSUPPORTED_FIELD",
        `Unsupported field '${key}'.`,
      );
    }
  }
}

function optionalString(body: Record<string, unknown>, key: string): string | undefined {
  const value = body[key];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new ServiceError(400, "INVALID_TYPE", `Field '${key}' must be a string.`);
  }
  return value;
}

function optionalBoolean(body: Record<string, unknown>, key: string): boolean | undefined {
  const value = body[key];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "boolean") {
    throw new ServiceError(400, "INVALID_TYPE", `Field '${key}' must be a boolean.`);
  }
  return value;
}

function optionalInteger(body: Record<string, unknown>, key: string): number | undefined {
  const value = body[key];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new ServiceError(400, "INVALID_TYPE", `Field '${key}' must be an integer.`);
  }
  return value;
}

function optionalGender(body: Record<string, unknown>): Gender | undefined {
  const value = body.gender;
  if (value === undefined) {
    return undefined;
  }
  if (value !== "male" && value !== "female" && value !== "any") {
    throw new ServiceError(400, "INVALID_ENUM", "Field 'gender' must be male, female, or any.");
  }
  return value;
}

function optionalLength(body: Record<string, unknown>): LengthRange | undefined {
  const value = body.length;
  if (value === undefined) {
    return undefined;
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new ServiceError(400, "INVALID_TYPE", "Field 'length' must be an object.");
  }

  const min = optionalInteger(value as Record<string, unknown>, "min");
  const max = optionalInteger(value as Record<string, unknown>, "max");

  if (min !== undefined && min < 0) {
    throw new ServiceError(422, "IMPOSSIBLE_CONSTRAINT", "Field 'length.min' must be non-negative.");
  }
  if (max !== undefined && max < 0) {
    throw new ServiceError(422, "IMPOSSIBLE_CONSTRAINT", "Field 'length.max' must be non-negative.");
  }
  if (min !== undefined && max !== undefined && min > max) {
    throw new ServiceError(422, "IMPOSSIBLE_CONSTRAINT", "Field 'length.min' cannot exceed 'length.max'.");
  }

  return { min, max };
}

function parseBase(body: unknown): BaseRequest {
  const object = ensureObject(body);
  assertSupportedFields(object);

  return {
    seed: optionalInteger(object, "seed"),
    locale: optionalString(object, "locale"),
    country: optionalString(object, "country"),
    startsWith: optionalString(object, "startsWith"),
    endsWith: optionalString(object, "endsWith"),
    contains: optionalString(object, "contains"),
    wildcard: optionalString(object, "wildcard"),
    exact: optionalString(object, "exact"),
    caseSensitive: optionalBoolean(object, "caseSensitive"),
    length: optionalLength(object),
  };
}

export function parseFirstNameRequest(body: unknown): FirstNameRequest {
  const object = ensureObject(body);
  return {
    ...parseBase(object),
    gender: optionalGender(object),
  };
}

export function parseLastNameRequest(body: unknown): LastNameRequest {
  return parseBase(body);
}

export function parseFullNameRequest(body: unknown): FullNameRequest {
  const object = ensureObject(body);
  const surnameCount = optionalInteger(object, "surnameCount");
  if (surnameCount !== undefined && surnameCount < 1) {
    throw new ServiceError(422, "IMPOSSIBLE_CONSTRAINT", "Field 'surnameCount' must be at least 1.");
  }

  return {
    ...parseBase(object),
    gender: optionalGender(object),
    middleName: optionalBoolean(object, "middleName"),
    surnameCount,
  };
}

export function parsePersonRequest(body: unknown): PersonRequest {
  const object = ensureObject(body);
  const age = optionalInteger(object, "age");
  const minAge = optionalInteger(object, "minAge");
  const maxAge = optionalInteger(object, "maxAge");

  for (const [key, value] of [["age", age], ["minAge", minAge], ["maxAge", maxAge]] as const) {
    if (value !== undefined && value < 0) {
      throw new ServiceError(422, "IMPOSSIBLE_CONSTRAINT", `Field '${key}' must be non-negative.`);
    }
  }
  if (age !== undefined && (minAge !== undefined || maxAge !== undefined)) {
    throw new ServiceError(422, "IMPOSSIBLE_CONSTRAINT", "Field 'age' cannot be combined with 'minAge' or 'maxAge'.");
  }
  if (minAge !== undefined && maxAge !== undefined && minAge > maxAge) {
    throw new ServiceError(422, "IMPOSSIBLE_CONSTRAINT", "Field 'minAge' cannot exceed 'maxAge'.");
  }

  return {
    ...parseBase(object),
    gender: optionalGender(object),
    age,
    minAge,
    maxAge,
  };
}

export function parseAddressRequest(body: unknown): AddressRequest {
  const object = ensureObject(body);
  return {
    ...parseBase(object),
    state: optionalString(object, "state"),
    city: optionalString(object, "city"),
    district: optionalString(object, "district"),
    postalCode: optionalString(object, "postalCode"),
    pin: optionalString(object, "pin"),
  };
}

export function parsePhoneRequest(body: unknown): PhoneRequest {
  return parseBase(body);
}

export function parseBatchDatasetRequest(body: unknown): BatchDatasetRequest {
  const object = ensureObject(body);
  const allowedFields = new Set(["count", "selected", "seed", "requests"]);

  for (const key of Object.keys(object)) {
    if (!allowedFields.has(key)) {
      throw new ServiceError(400, "UNSUPPORTED_FIELD", `Unsupported field '${key}'.`);
    }
  }

  const count = optionalInteger(object, "count");
  if (count === undefined) {
    throw new ServiceError(400, "INVALID_REQUEST", "Field 'count' is required.");
  }
  if (count < 1 || count > 500) {
    throw new ServiceError(422, "IMPOSSIBLE_CONSTRAINT", "Field 'count' must be between 1 and 500.");
  }

  const selectedValue = object.selected;
  if (!Array.isArray(selectedValue) || selectedValue.some((entry) => typeof entry !== "string")) {
    throw new ServiceError(400, "INVALID_TYPE", "Field 'selected' must be an array of generator ids.");
  }

  const selected = Array.from(new Set(selectedValue)) as string[];
  if (selected.length === 0) {
    throw new ServiceError(422, "IMPOSSIBLE_CONSTRAINT", "Select at least one generator.");
  }

  for (const generatorId of selected) {
    if (!batchGeneratorIds.has(generatorId as BatchGeneratorId)) {
      throw new ServiceError(400, "INVALID_ENUM", `Unknown generator '${generatorId}'.`);
    }
  }

  const requestsValue = object.requests;
  if (requestsValue !== undefined && (requestsValue === null || typeof requestsValue !== "object" || Array.isArray(requestsValue))) {
    throw new ServiceError(400, "INVALID_TYPE", "Field 'requests' must be an object.");
  }

  const requestsObject = (requestsValue ?? {}) as Record<string, unknown>;
  const requests: BatchDatasetRequest["requests"] = {};

  for (const [generatorId, requestBody] of Object.entries(requestsObject)) {
    if (!batchGeneratorIds.has(generatorId as BatchGeneratorId)) {
      throw new ServiceError(400, "INVALID_ENUM", `Unknown generator '${generatorId}'.`);
    }
    if (!selected.includes(generatorId)) {
      throw new ServiceError(422, "IMPOSSIBLE_CONSTRAINT", `Generator '${generatorId}' must be selected before providing request overrides.`);
    }
    switch (generatorId as BatchGeneratorId) {
      case "firstname":
        requests.firstname = parseFirstNameRequest(requestBody);
        break;
      case "lastname":
        requests.lastname = parseLastNameRequest(requestBody);
        break;
      case "fullname":
        requests.fullname = parseFullNameRequest(requestBody);
        break;
      case "person":
        requests.person = parsePersonRequest(requestBody);
        break;
      case "address":
        requests.address = parseAddressRequest(requestBody);
        break;
      case "phone":
        requests.phone = parsePhoneRequest(requestBody);
        break;
    }
  }

  return {
    count,
    seed: optionalInteger(object, "seed"),
    selected: selected as BatchGeneratorId[],
    requests,
  };
}