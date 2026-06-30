export type Gender = "male" | "female" | "any";

export interface LengthRange {
  min?: number;
  max?: number;
}

export interface BaseRequest {
  seed?: number;
  locale?: string;
  country?: string;
  startsWith?: string;
  endsWith?: string;
  contains?: string;
  wildcard?: string;
  exact?: string;
  caseSensitive?: boolean;
  length?: LengthRange;
}

export interface FirstNameRequest extends BaseRequest {
  gender?: Gender;
}

export type LastNameRequest = BaseRequest;

export interface FullNameRequest extends BaseRequest {
  gender?: Gender;
  middleName?: boolean;
  surnameCount?: number;
}

export interface PersonRequest extends BaseRequest {
  gender?: Gender;
  age?: number;
  minAge?: number;
  maxAge?: number;
}

export interface AddressRequest extends BaseRequest {
  state?: string;
  city?: string;
  district?: string;
  postalCode?: string;
  pin?: string;
}

export type PhoneRequest = BaseRequest;

export type BatchGeneratorId =
  | "firstname"
  | "lastname"
  | "fullname"
  | "person"
  | "address"
  | "phone";

export interface BatchDatasetRequest {
  count: number;
  selected: BatchGeneratorId[];
  seed?: number;
  requests?: Partial<{
    firstname: FirstNameRequest;
    lastname: LastNameRequest;
    fullname: FullNameRequest;
    person: PersonRequest;
    address: AddressRequest;
    phone: PhoneRequest;
  }>;
}

export interface BatchDatasetResponse {
  count: number;
  selected: BatchGeneratorId[];
  records: Record<string, unknown>[];
}

export interface ValueResponse {
  value: string;
}

export interface FullNameResponse {
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
}

export interface PersonResponse extends FullNameResponse {
  gender: Gender;
  dateOfBirth: string;
  age: number;
}

export interface AddressResponse {
  houseNumber: string;
  street: string;
  area: string;
  city: string;
  district: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface PhoneResponse {
  countryCode: string;
  nationalNumber: string;
  international: string;
}

export interface NameRecord {
  value: string;
  gender?: Exclude<Gender, "any">;
  country?: string[];
  weight?: number;
}

export interface PostalRecord {
  postalCode: string;
  city: string;
  district: string;
  state: string;
  country: string;
  areas: string[];
  weight?: number;
}

export interface PhonePlan {
  country: string;
  countryCode: string;
  nationalLength: number;
  prefixes: string[];
}

export interface Generator<TRequest, TResult> {
  generate(
    request: TRequest,
    context?: import("../random/prng.ts").GenerationContext,
  ): Promise<TResult> | TResult;
}