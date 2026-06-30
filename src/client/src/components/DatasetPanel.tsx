import { useEffect, useMemo, useState } from "react";

import { createDatasetEntry, deleteDatasetEntry, exportDataset, fetchDataset, importDataset, updateDatasetEntry } from "../api";
import { downloadBlob } from "../export";
import { blankValues, buildPayload, entryToFormValues, type FormValues, validateForm } from "../forms";
import type { DatasetDefinition } from "../types";
import { FieldInput } from "./FieldInput";

type Props = {
    definition: DatasetDefinition;
    refreshToken: number;
    onMutated: () => void;
};

export function DatasetPanel({ definition, refreshToken, onMutated }: Props) {
    const [entries, setEntries] = useState<unknown[]>([]);
    const [search, setSearch] = useState("");
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [values, setValues] = useState<FormValues>(() => blankValues(definition.fields));
    const [error, setError] = useState("");
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError("");
        fetchDataset(definition.id)
            .then((response) => {
                if (cancelled) {
                    return;
                }
                setEntries(response.entries);
                setSelectedIndex(null);
                setValues(blankValues(definition.fields));
            })
            .catch((loadError) => {
                if (!cancelled) {
                    setError(loadError instanceof Error ? loadError.message : "Failed to load dataset.");
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [definition, refreshToken]);

    const filteredEntries = useMemo(() => {
        if (!search.trim()) {
            return entries.map((entry, index) => ({ entry, index }));
        }
        const needle = search.toLowerCase();
        return entries
            .map((entry, index) => ({ entry, index }))
            .filter(({ entry }) => JSON.stringify(entry).toLowerCase().includes(needle));
    }, [entries, search]);

    function startCreate() {
        setSelectedIndex(null);
        setValues(blankValues(definition.fields));
        setStatus("");
        setError("");
    }

    function startEdit(entry: unknown, index: number) {
        setSelectedIndex(index);
        setValues(entryToFormValues(definition.entryType, entry));
        setStatus("");
        setError("");
    }

    async function handleSave(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const validationErrors = validateForm(definition.fields, values);
        if (validationErrors.length > 0) {
            setError(validationErrors.join(" "));
            return;
        }

        setLoading(true);
        setError("");
        setStatus("");

        try {
            const payload = definition.entryType === "string"
                ? String(values.value ?? "")
                : buildPayload(definition.fields, values);

            if (selectedIndex === null) {
                await createDatasetEntry(definition.id, payload);
                setStatus("Entry created.");
            } else {
                await updateDatasetEntry(definition.id, selectedIndex, payload);
                setStatus("Entry updated.");
            }
            onMutated();
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "Failed to save dataset entry.");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(index: number) {
        setLoading(true);
        setError("");
        setStatus("");
        try {
            await deleteDatasetEntry(definition.id, index);
            setStatus("Entry deleted.");
            onMutated();
        } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : "Failed to delete dataset entry.");
        } finally {
            setLoading(false);
        }
    }

    async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }
        try {
            const text = await file.text();
            const payload = JSON.parse(text) as unknown;
            if (!Array.isArray(payload)) {
                throw new Error("Imported JSON must be an array.");
            }
            await importDataset(definition.id, payload);
            setStatus("Dataset imported.");
            setError("");
            onMutated();
        } catch (importError) {
            setError(importError instanceof Error ? importError.message : "Failed to import dataset.");
        } finally {
            event.target.value = "";
        }
    }

    async function handleExport(format: "json" | "csv") {
        try {
            const blob = await exportDataset(definition.id, format);
            downloadBlob(`${definition.id.replace(/\//g, "-")}.${format}`, blob);
        } catch (exportError) {
            setError(exportError instanceof Error ? exportError.message : "Failed to export dataset.");
        }
    }

    return (
        <section className="panel-stack">
            <div className="panel-header">
                <div>
                    <p className="eyebrow">Dataset</p>
                    <h2>{definition.label}</h2>
                    <p>{definition.description}</p>
                </div>
                <div className="header-actions">
                    <button className="button secondary" type="button" onClick={startCreate}>New Entry</button>
                    <button className="button secondary" type="button" onClick={() => handleExport("json")}>Export JSON</button>
                    <button className="button secondary" type="button" onClick={() => handleExport("csv")}>Export CSV</button>
                    <label className="button secondary file-button">
                        Import JSON
                        <input type="file" accept="application/json" onChange={handleImport} />
                    </label>
                </div>
            </div>

            <div className="panel-grid dataset-grid">
                <div className="card dataset-list-card">
                    <div className="list-toolbar">
                        <input
                            type="search"
                            placeholder="Search entries"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                        <span>{filteredEntries.length} items</span>
                    </div>
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    {definition.entryType === "string"
                                        ? <th>Value</th>
                                        : definition.fields.slice(0, 4).map((field) => <th key={field.name}>{field.label}</th>)}
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEntries.map(({ entry, index }) => (
                                    <tr key={`${definition.id}-${index}`}>
                                        <td>{index}</td>
                                        {definition.entryType === "string"
                                            ? <td>{String(entry)}</td>
                                            : definition.fields.slice(0, 4).map((field) => <td key={field.name}>{renderCell(entry, field.name)}</td>)}
                                        <td className="row-actions">
                                            <button className="button tertiary" type="button" onClick={() => startEdit(entry, index)}>Edit</button>
                                            <button className="button tertiary danger" type="button" onClick={() => handleDelete(index)}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <form className="card form-card" onSubmit={handleSave}>
                    <div className="panel-subheader">
                        <h3>{selectedIndex === null ? "Create Entry" : `Edit Entry #${selectedIndex}`}</h3>
                        {loading ? <span className="muted">Working...</span> : null}
                    </div>
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
                        <button className="button primary" type="submit">{selectedIndex === null ? "Create" : "Save"}</button>
                        <button className="button secondary" type="button" onClick={startCreate}>Clear</button>
                    </div>
                    {status ? <div className="banner success">{status}</div> : null}
                    {error ? <div className="banner error">{error}</div> : null}
                </form>
            </div>
        </section>
    );
}

function renderCell(entry: unknown, fieldName: string): string {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return String(entry ?? "");
    }
    const value = (entry as Record<string, unknown>)[fieldName];
    if (Array.isArray(value)) {
        return value.join(", ");
    }
    return String(value ?? "");
}