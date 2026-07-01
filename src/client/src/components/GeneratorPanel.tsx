import { useEffect, useState } from "react";
import { Button, Card, SubmitButton } from "@wtasnorg/ui";

import { generate } from "../api";
import { blankValues, buildPayload, flattenObject, type FormValues } from "../forms";
import type { GeneratorDefinition } from "../types";
import { FieldInput } from "./FieldInput";

type Props = {
    definition: GeneratorDefinition;
};

export function GeneratorPanel({ definition }: Props) {
    const [values, setValues] = useState<FormValues>(() => ({ ...blankValues(definition.fields), ...flattenObject(definition.exampleRequest) }));
    const [response, setResponse] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setValues({ ...blankValues(definition.fields), ...flattenObject(definition.exampleRequest) });
        setResponse("");
        setError("");
    }, [definition]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError("");
        setResponse("");
        try {
            const payload = buildPayload(definition.fields, values);
            const result = await generate(definition.path, payload);
            setResponse(JSON.stringify(result, null, 2));
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Unknown request error.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="panel-stack">
            <div className="panel-header">
                <div>
                    <p className="eyebrow">Generator</p>
                    <h2>{definition.label}</h2>
                    <p>{definition.description}</p>
                </div>
            </div>

            <div className="panel-grid">
                <Card className="card form-card">
                    <form onSubmit={handleSubmit}>
                        <div className="field-grid">
                            {definition.fields.map((field) => (
                                <FieldInput
                                    key={field.name}
                                    field={field}
                                    value={values[field.name]}
                                    onChange={(name, value) => setValues((current) => ({ ...current, [name]: value }))}
                                />
                            ))}
                        </div>
                        <div className="actions">
                            <SubmitButton className="button primary" loading={loading} loadingLabel="Generating...">Generate</SubmitButton>
                            <Button
                                className="button secondary"
                                type="button"
                                onClick={() => setValues({ ...blankValues(definition.fields), ...flattenObject(definition.exampleRequest) })}
                            >
                                Reset
                            </Button>
                        </div>
                        {error ? <div className="banner error">{error}</div> : null}
                    </form>
                </Card>

                <Card className="card output-card">
                    <div className="output-header">
                        <h3>Response</h3>
                    </div>
                    <pre>{response || JSON.stringify(definition.exampleRequest, null, 2)}</pre>
                </Card>
            </div>
        </section>
    );
}
