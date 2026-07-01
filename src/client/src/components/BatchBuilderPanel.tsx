import { useMemo, useState } from "react";
import { Badge, Button, Card, FormInput, FormLabel } from "@wtasnorg/ui";

import { generateBatch } from "../api";
import { downloadText, recordsToCsv } from "../export";
import type { BatchDatasetResponse, GeneratorDefinition } from "../types";

type Props = {
    generators: GeneratorDefinition[];
};

export function BatchBuilderPanel({ generators }: Props) {
    const [count, setCount] = useState("10");
    const [selected, setSelected] = useState<string[]>(["firstname", "lastname"]);
    const [result, setResult] = useState<BatchDatasetResponse | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const sortedGenerators = useMemo(() => generators.slice().sort((left, right) => left.label.localeCompare(right.label)), [generators]);

    function toggleGenerator(id: string) {
        setSelected((current) => current.includes(id)
            ? current.filter((entry) => entry !== id)
            : [...current, id]);
    }

    async function handleGenerate() {
        setLoading(true);
        setError("");
        setResult(null);
        try {
            const parsedCount = Number(count);
            const payload = {
                count: Number.isNaN(parsedCount) ? 0 : parsedCount,
                selected,
            };
            const nextResult = await generateBatch(payload);
            setResult(nextResult);
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Unknown request error.");
        } finally {
            setLoading(false);
        }
    }

    function exportJson() {
        if (!result) {
            return;
        }
        downloadText("generated-records.json", `${JSON.stringify(result, null, 2)}\n`, "application/json");
    }

    function exportCsv() {
        if (!result) {
            return;
        }
        downloadText("generated-records.csv", recordsToCsv(result.records), "text/csv;charset=utf-8");
    }

    return (
        <section className="panel-stack">
            <div className="panel-header">
                <div>
                    <p className="eyebrow">Batch Builder</p>
                    <h2>Record Builder</h2>
                    <p>Select generators, choose a record count, then generate a random dataset in one request.</p>
                </div>
                <div className="stat-row">
                    <Badge className="stat-pill"><strong>{selected.length}</strong><span>fields</span></Badge>
                    <Badge className="stat-pill"><strong>{count || 0}</strong><span>records</span></Badge>
                </div>
            </div>

            <div className="panel-grid">
                <Card className="card form-card">
                    <div className="field count-field">
                        <FormLabel htmlFor="record-count">Record Count</FormLabel>
                        <FormInput
                            id="record-count"
                            aria-label="Record Count"
                            type="number"
                            min="1"
                            max="500"
                            value={count}
                            onChange={(event) => setCount(event.target.value)}
                        />
                    </div>

                    <div className="checkbox-grid">
                        {sortedGenerators.map((generator) => {
                            const checked = selected.includes(generator.id);
                            return (
                                <label key={generator.id} className={`choice-card ${checked ? "selected" : ""}`}>
                                    <FormInput
                                        aria-label={generator.label}
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggleGenerator(generator.id)}
                                    />
                                    <div>
                                        <strong>{generator.label}</strong>
                                        <p>{generator.description}</p>
                                    </div>
                                </label>
                            );
                        })}
                    </div>

                    <div className="actions">
                        <Button className="button primary" type="button" onClick={handleGenerate} disabled={loading} loading={loading}>
                            Generate Dataset
                        </Button>
                    </div>

                    {error ? <div className="banner error">{error}</div> : null}
                </Card>

                <Card className="card output-card">
                    <div className="output-header">
                        <h3>Generated Records</h3>
                        <div className="header-actions compact-actions">
                            <Button className="button secondary" type="button" onClick={exportJson} disabled={!result}>Export JSON</Button>
                            <Button className="button secondary" type="button" onClick={exportCsv} disabled={!result}>Export CSV</Button>
                        </div>
                    </div>
                    <pre>{JSON.stringify(result ?? { count: Number(count || 0), selected, records: [] }, null, 2)}</pre>
                </Card>
            </div>
        </section>
    );
}
