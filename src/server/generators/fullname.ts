import type {
    FullNameRequest,
    FullNameResponse,
    Generator,
} from "../models/types.ts";
import type { GenerationContext } from "../random/prng.ts";
import { FirstNameGenerator } from "./firstname.ts";
import { LastNameGenerator } from "./lastname.ts";
import { resolveContext } from "./shared.ts";

export class FullNameGenerator implements Generator<FullNameRequest, FullNameResponse> {
    readonly #firstNameGenerator = new FirstNameGenerator();
    readonly #lastNameGenerator = new LastNameGenerator();

    async generate(
        request: FullNameRequest,
        context?: GenerationContext,
    ): Promise<FullNameResponse> {
        const resolvedContext = resolveContext(request.seed, context);
        const firstName = await this.#firstNameGenerator.generate(request, resolvedContext);
        const unfilteredNameRequest = {
            ...request,
            startsWith: undefined,
            endsWith: undefined,
            contains: undefined,
            wildcard: undefined,
            exact: undefined,
        };
        const middle = request.middleName
            ? await this.#firstNameGenerator.generate(
                unfilteredNameRequest,
                resolvedContext,
            )
            : undefined;

        const surnameCount = request.surnameCount ?? 1;
        const lastParts: string[] = [];
        for (let index = 0; index < surnameCount; index += 1) {
            lastParts.push((await this.#lastNameGenerator.generate(unfilteredNameRequest, resolvedContext)).value);
        }

        const lastName = lastParts.join(" ");
        const fullName = [firstName.value, middle?.value, lastName].filter(Boolean).join(" ");

        return {
            firstName: firstName.value,
            middleName: middle?.value,
            lastName,
            fullName,
        };
    }
}