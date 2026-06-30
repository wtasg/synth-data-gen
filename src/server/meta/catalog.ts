import { ServiceError } from "../validation/errors.ts";

export interface FieldDefinition {
    readonly name: string;
    readonly label: string;
    readonly type: "string" | "number" | "boolean" | "string[]" | "enum";
    readonly required?: boolean;
    readonly options?: readonly string[];
    readonly description?: string;
    readonly placeholder?: string;
}

export interface GeneratorDefinition {
    readonly id: string;
    readonly label: string;
    readonly path: string;
    readonly description: string;
    readonly fields: readonly FieldDefinition[];
    readonly exampleRequest: Record<string, unknown>;
}

export interface DatasetDefinition {
    readonly id: string;
    readonly label: string;
    readonly path: string;
    readonly entryType: "object" | "string";
    readonly fields: readonly FieldDefinition[];
    readonly description: string;
}

const baseGeneratorFields = [
    { name: "seed", label: "Seed", type: "number", placeholder: "123" },
    { name: "country", label: "Country", type: "string", placeholder: "US" },
    { name: "startsWith", label: "Starts With", type: "string", placeholder: "stu*" },
    { name: "endsWith", label: "Ends With", type: "string" },
    { name: "contains", label: "Contains", type: "string" },
    { name: "wildcard", label: "Wildcard", type: "string", placeholder: "ann*" },
    { name: "exact", label: "Exact", type: "string" },
    { name: "caseSensitive", label: "Case Sensitive", type: "boolean" },
    { name: "length.min", label: "Length Min", type: "number" },
    { name: "length.max", label: "Length Max", type: "number" },
] as const satisfies readonly FieldDefinition[];

export const generatorDefinitions: readonly GeneratorDefinition[] = [
    {
        id: "firstname",
        label: "First Name",
        path: "/api/v1/firstname",
        description: "Generate a first name using locale, gender, and pattern filters.",
        fields: [
            { name: "gender", label: "Gender", type: "enum", options: ["male", "female", "any"] },
            ...baseGeneratorFields,
        ],
        exampleRequest: { gender: "male", startsWith: "stu", seed: 123, length: { min: 5, max: 10 } },
    },
    {
        id: "lastname",
        label: "Last Name",
        path: "/api/v1/lastname",
        description: "Generate a last name using text filters and seed control.",
        fields: [...baseGeneratorFields],
        exampleRequest: { startsWith: "mc" },
    },
    {
        id: "fullname",
        label: "Full Name",
        path: "/api/v1/fullname",
        description: "Generate a full name with optional middle names and multiple surnames.",
        fields: [
            { name: "gender", label: "Gender", type: "enum", options: ["male", "female", "any"] },
            { name: "middleName", label: "Include Middle Name", type: "boolean" },
            { name: "surnameCount", label: "Surname Count", type: "number" },
            ...baseGeneratorFields,
        ],
        exampleRequest: { gender: "female", middleName: true, surnameCount: 2, startsWith: "ann*", seed: 321 },
    },
    {
        id: "person",
        label: "Person",
        path: "/api/v1/person",
        description: "Generate a person record with name, age, and date of birth.",
        fields: [
            { name: "gender", label: "Gender", type: "enum", options: ["male", "female", "any"] },
            { name: "age", label: "Exact Age", type: "number" },
            { name: "minAge", label: "Min Age", type: "number" },
            { name: "maxAge", label: "Max Age", type: "number" },
            ...baseGeneratorFields,
        ],
        exampleRequest: { gender: "male", country: "US", seed: 77 },
    },
    {
        id: "address",
        label: "Address",
        path: "/api/v1/address",
        description: "Generate an address filtered by geography and postal pattern.",
        fields: [
            { name: "state", label: "State", type: "string" },
            { name: "city", label: "City", type: "string" },
            { name: "district", label: "District", type: "string" },
            { name: "postalCode", label: "Postal Code", type: "string" },
            { name: "pin", label: "PIN Pattern", type: "string", placeholder: "560*" },
            ...baseGeneratorFields,
        ],
        exampleRequest: { country: "IN", state: "Karnataka", pin: "560*", seed: 10 },
    },
    {
        id: "phone",
        label: "Phone",
        path: "/api/v1/phone",
        description: "Generate a phone number with country-specific numbering plans.",
        fields: [...baseGeneratorFields],
        exampleRequest: { country: "IN", startsWith: "98*", seed: 12 },
    },
];

const nameFields = [
    { name: "value", label: "Value", type: "string", required: true },
    { name: "gender", label: "Gender", type: "enum", options: ["male", "female"] },
    { name: "country", label: "Countries", type: "string[]" },
    { name: "weight", label: "Weight", type: "number" },
] as const satisfies readonly FieldDefinition[];

export const datasetDefinitions: readonly DatasetDefinition[] = [
    {
        id: "firstname/en",
        label: "First Names (EN)",
        path: "firstname/en.json",
        entryType: "object",
        fields: nameFields,
        description: "English first-name records.",
    },
    {
        id: "firstname/hi",
        label: "First Names (HI)",
        path: "firstname/hi.json",
        entryType: "object",
        fields: nameFields,
        description: "Hindi first-name records.",
    },
    {
        id: "firstname/fr",
        label: "First Names (FR)",
        path: "firstname/fr.json",
        entryType: "object",
        fields: nameFields,
        description: "French first-name records.",
    },
    {
        id: "lastname/en",
        label: "Last Names (EN)",
        path: "lastname/en.json",
        entryType: "object",
        fields: [
            { name: "value", label: "Value", type: "string", required: true },
            { name: "weight", label: "Weight", type: "number" },
        ],
        description: "Last-name records.",
    },
    {
        id: "postal/us",
        label: "Postal Codes (US)",
        path: "postal/us.json",
        entryType: "object",
        fields: [
            { name: "postalCode", label: "Postal Code", type: "string", required: true },
            { name: "city", label: "City", type: "string", required: true },
            { name: "district", label: "District", type: "string", required: true },
            { name: "state", label: "State", type: "string", required: true },
            { name: "country", label: "Country", type: "string", required: true },
            { name: "areas", label: "Areas", type: "string[]", required: true },
            { name: "weight", label: "Weight", type: "number" },
        ],
        description: "US postal data.",
    },
    {
        id: "postal/in",
        label: "Postal Codes (IN)",
        path: "postal/in.json",
        entryType: "object",
        fields: [
            { name: "postalCode", label: "Postal Code", type: "string", required: true },
            { name: "city", label: "City", type: "string", required: true },
            { name: "district", label: "District", type: "string", required: true },
            { name: "state", label: "State", type: "string", required: true },
            { name: "country", label: "Country", type: "string", required: true },
            { name: "areas", label: "Areas", type: "string[]", required: true },
            { name: "weight", label: "Weight", type: "number" },
        ],
        description: "India postal data.",
    },
    {
        id: "postal/fr",
        label: "Postal Codes (FR)",
        path: "postal/fr.json",
        entryType: "object",
        fields: [
            { name: "postalCode", label: "Postal Code", type: "string", required: true },
            { name: "city", label: "City", type: "string", required: true },
            { name: "district", label: "District", type: "string", required: true },
            { name: "state", label: "State", type: "string", required: true },
            { name: "country", label: "Country", type: "string", required: true },
            { name: "areas", label: "Areas", type: "string[]", required: true },
            { name: "weight", label: "Weight", type: "number" },
        ],
        description: "France postal data.",
    },
    {
        id: "streets/us",
        label: "Street Names (US)",
        path: "streets/us.json",
        entryType: "string",
        fields: [{ name: "value", label: "Value", type: "string", required: true }],
        description: "US street name values.",
    },
    {
        id: "streets/in",
        label: "Street Names (IN)",
        path: "streets/in.json",
        entryType: "string",
        fields: [{ name: "value", label: "Value", type: "string", required: true }],
        description: "India street name values.",
    },
    {
        id: "streets/fr",
        label: "Street Names (FR)",
        path: "streets/fr.json",
        entryType: "string",
        fields: [{ name: "value", label: "Value", type: "string", required: true }],
        description: "France street name values.",
    },
    {
        id: "phone/plans",
        label: "Phone Plans",
        path: "phone/plans.json",
        entryType: "object",
        fields: [
            { name: "country", label: "Country", type: "string", required: true },
            { name: "countryCode", label: "Country Code", type: "string", required: true },
            { name: "nationalLength", label: "National Length", type: "number", required: true },
            { name: "prefixes", label: "Prefixes", type: "string[]", required: true },
        ],
        description: "Phone numbering plan records.",
    },
];

export function getDatasetDefinition(datasetId: string): DatasetDefinition {
    const definition = datasetDefinitions.find((entry) => entry.id === datasetId);
    if (!definition) {
        throw new ServiceError(404, "DATASET_NOT_FOUND", `Unknown dataset '${datasetId}'.`);
    }
    return definition;
}

export function getMeta(): { generators: readonly GeneratorDefinition[]; datasets: readonly DatasetDefinition[] } {
    return {
        generators: generatorDefinitions,
        datasets: datasetDefinitions,
    };
}