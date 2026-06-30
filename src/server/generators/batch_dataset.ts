import type {
  AddressRequest,
  BatchDatasetRequest,
  BatchDatasetResponse,
  BatchGeneratorId,
  FirstNameRequest,
  FullNameRequest,
  LastNameRequest,
  PersonRequest,
  PhoneRequest,
} from "../models/types.ts";
import type { GenerationContext } from "../random/prng.ts";
import { resolveContext } from "./shared.ts";
import { AddressGenerator } from "./address.ts";
import { FirstNameGenerator } from "./firstname.ts";
import { FullNameGenerator } from "./fullname.ts";
import { LastNameGenerator } from "./lastname.ts";
import { PersonGenerator } from "./person.ts";
import { PhoneGenerator } from "./phone.ts";

type BatchHandler = {
  generate: (request: unknown, context: GenerationContext) => Promise<unknown>;
  toRecord: (result: unknown) => Record<string, unknown>;
};

function mergeRecord(record: Record<string, unknown>, fragment: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(fragment)) {
    record[key] = value;
  }
}

export class BatchDatasetGenerator {
  readonly #handlers: Record<BatchGeneratorId, BatchHandler>;

  constructor(
    firstNameGenerator = new FirstNameGenerator(),
    lastNameGenerator = new LastNameGenerator(),
    fullNameGenerator = new FullNameGenerator(),
    personGenerator = new PersonGenerator(),
    addressGenerator = new AddressGenerator(),
    phoneGenerator = new PhoneGenerator(),
  ) {
    this.#handlers = {
      firstname: {
        generate: (request, context) => firstNameGenerator.generate(request as FirstNameRequest, context),
        toRecord: (result) => ({ firstName: (result as { value: string }).value }),
      },
      lastname: {
        generate: (request, context) => lastNameGenerator.generate(request as LastNameRequest, context),
        toRecord: (result) => ({ lastName: (result as { value: string }).value }),
      },
      fullname: {
        generate: (request, context) => fullNameGenerator.generate(request as FullNameRequest, context),
        toRecord: (result) => result as Record<string, unknown>,
      },
      person: {
        generate: (request, context) => personGenerator.generate(request as PersonRequest, context),
        toRecord: (result) => ({ person: result }),
      },
      address: {
        generate: (request, context) => addressGenerator.generate(request as AddressRequest, context),
        toRecord: (result) => ({ address: result }),
      },
      phone: {
        generate: (request, context) => phoneGenerator.generate(request as PhoneRequest, context),
        toRecord: (result) => ({ phone: result }),
      },
    };
  }

  async generate(
    request: BatchDatasetRequest,
    context?: GenerationContext,
  ): Promise<BatchDatasetResponse> {
    const resolvedContext = resolveContext(request.seed, context);
    const records: Record<string, unknown>[] = [];

    for (let index = 0; index < request.count; index += 1) {
      const record: Record<string, unknown> = {};
      for (const generatorId of request.selected) {
        const handler = this.#handlers[generatorId];
        const nestedRequest = request.requests?.[generatorId] ?? {};
        const result = await handler.generate(nestedRequest, resolvedContext);
        mergeRecord(record, handler.toRecord(result));
      }
      records.push(record);
    }

    return {
      count: request.count,
      selected: request.selected,
      records,
    };
  }
}