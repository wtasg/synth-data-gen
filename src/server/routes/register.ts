import type {
  AddressRequest,
  BatchDatasetRequest,
  FirstNameRequest,
  FullNameRequest,
  LastNameRequest,
  PersonRequest,
  PhoneRequest,
} from "../models/types.ts";
import { AddressGenerator } from "../generators/address.ts";
import { BatchDatasetGenerator } from "../generators/batch_dataset.ts";
import { FirstNameGenerator } from "../generators/firstname.ts";
import { FullNameGenerator } from "../generators/fullname.ts";
import { LastNameGenerator } from "../generators/lastname.ts";
import { PersonGenerator } from "../generators/person.ts";
import { PhoneGenerator } from "../generators/phone.ts";
import {
  parseAddressRequest,
  parseBatchDatasetRequest,
  parseFirstNameRequest,
  parseFullNameRequest,
  parseLastNameRequest,
  parsePersonRequest,
  parsePhoneRequest,
} from "../validation/request.ts";

export interface RouteDefinition {
  readonly path: string;
  readonly handle: (body: unknown) => Promise<Response>;
}

function route<TRequest>(
  path: string,
  parse: (body: unknown) => TRequest,
  generate: (request: TRequest) => Promise<unknown>,
): RouteDefinition {
  return {
    path,
    async handle(body: unknown): Promise<Response> {
      const request = parse(body);
      const result = await generate(request);
      return Response.json(result);
    },
  };
}

const firstNameGenerator = new FirstNameGenerator();
const lastNameGenerator = new LastNameGenerator();
const fullNameGenerator = new FullNameGenerator();
const personGenerator = new PersonGenerator();
const addressGenerator = new AddressGenerator();
const phoneGenerator = new PhoneGenerator();
const batchDatasetGenerator = new BatchDatasetGenerator(
  firstNameGenerator,
  lastNameGenerator,
  fullNameGenerator,
  personGenerator,
  addressGenerator,
  phoneGenerator,
);

export function registerRoutes(): RouteDefinition[] {
  return [
    route<FirstNameRequest>("/api/v1/firstname", parseFirstNameRequest, (request) =>
      firstNameGenerator.generate(request)),
    route<LastNameRequest>("/api/v1/lastname", parseLastNameRequest, (request) =>
      lastNameGenerator.generate(request)),
    route<FullNameRequest>("/api/v1/fullname", parseFullNameRequest, (request) =>
      fullNameGenerator.generate(request)),
    route<PersonRequest>("/api/v1/person", parsePersonRequest, (request) =>
      personGenerator.generate(request)),
    route<AddressRequest>("/api/v1/address", parseAddressRequest, (request) =>
      addressGenerator.generate(request)),
    route<PhoneRequest>("/api/v1/phone", parsePhoneRequest, (request) =>
      phoneGenerator.generate(request)),
    route<BatchDatasetRequest>("/api/v1/batch", parseBatchDatasetRequest, (request) =>
      batchDatasetGenerator.generate(request)),
  ];
}