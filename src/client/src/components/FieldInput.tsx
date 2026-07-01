import { useId, type ChangeEvent } from "react";
import { FormCheckbox, FormInput, FormLabel, FormSelect, FormTextarea } from "@wtasnorg/ui";

import type { FieldDefinition } from "../types";

type Props = {
    field: FieldDefinition;
    value: string | boolean | undefined;
    onChange: (name: string, value: string | boolean) => void;
};

export function FieldInput({ field, value, onChange }: Props) {
    const inputId = useId();

    function handleTextChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
        onChange(field.name, event.target.value);
    }

    if (field.type === "boolean") {
        return (
            <div className="field field-checkbox">
                <FormCheckbox
                    id={inputId}
                    label={field.label}
                    checked={Boolean(value)}
                    onChange={(event) => onChange(field.name, event.target.checked)}
                />
            </div>
        );
    }

    if (field.type === "enum") {
        return (
            <div className="field">
                <FormLabel htmlFor={inputId}>{field.label}</FormLabel>
                <FormSelect id={inputId} value={typeof value === "string" ? value : ""} onChange={handleTextChange}>
                    <option value="">Any</option>
                    {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                </FormSelect>
            </div>
        );
    }

    if (field.type === "string[]") {
        return (
            <div className="field field-wide">
                <FormLabel htmlFor={inputId}>{field.label}</FormLabel>
                <FormTextarea
                    id={inputId}
                    rows={3}
                    value={typeof value === "string" ? value : ""}
                    onChange={handleTextChange}
                    placeholder="comma or newline separated"
                />
            </div>
        );
    }

    return (
        <div className="field">
            <FormLabel htmlFor={inputId}>{field.label}</FormLabel>
            <FormInput
                id={inputId}
                type={field.type === "number" ? "number" : "text"}
                value={typeof value === "string" ? value : ""}
                onChange={handleTextChange}
                placeholder={field.placeholder}
            />
        </div>
    );
}
