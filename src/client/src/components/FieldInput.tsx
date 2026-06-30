import type { ChangeEvent } from "react";

import type { FieldDefinition } from "../types";

type Props = {
    field: FieldDefinition;
    value: string | boolean | undefined;
    onChange: (name: string, value: string | boolean) => void;
};

export function FieldInput({ field, value, onChange }: Props) {
    function handleTextChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
        onChange(field.name, event.target.value);
    }

    if (field.type === "boolean") {
        return (
            <label className="field field-checkbox">
                <span>{field.label}</span>
                <input
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(event) => onChange(field.name, event.target.checked)}
                />
            </label>
        );
    }

    if (field.type === "enum") {
        return (
            <label className="field">
                <span>{field.label}</span>
                <select value={typeof value === "string" ? value : ""} onChange={handleTextChange}>
                    <option value="">Any</option>
                    {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
            </label>
        );
    }

    if (field.type === "string[]") {
        return (
            <label className="field field-wide">
                <span>{field.label}</span>
                <textarea
                    rows={3}
                    value={typeof value === "string" ? value : ""}
                    onChange={handleTextChange}
                    placeholder="comma or newline separated"
                />
            </label>
        );
    }

    return (
        <label className="field">
            <span>{field.label}</span>
            <input
                type={field.type === "number" ? "number" : "text"}
                value={typeof value === "string" ? value : ""}
                onChange={handleTextChange}
                placeholder={field.placeholder}
            />
        </label>
    );
}