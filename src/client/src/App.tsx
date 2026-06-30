import { useEffect, useState } from "react";

import { fetchDatasetList, fetchMeta } from "./api";
import { BatchBuilderPanel } from "./components/BatchBuilderPanel";
import { DatasetPanel } from "./components/DatasetPanel";
import { GeneratorPanel } from "./components/GeneratorPanel";
import type { DatasetListItem, MetaResponse } from "./types";

type Selection =
    | { kind: "builder"; id: "batch" }
    | { kind: "generator"; id: string }
    | { kind: "dataset"; id: string };

export default function App() {
    const [meta, setMeta] = useState<MetaResponse | null>(null);
    const [datasetStats, setDatasetStats] = useState<Record<string, DatasetListItem>>({});
    const [selection, setSelection] = useState<Selection | null>(null);
    const [theme, setTheme] = useState<"dark" | "light">("dark");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshToken, setRefreshToken] = useState(0);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([fetchMeta(), fetchDatasetList()])
            .then(([metaResponse, datasetResponse]) => {
                if (cancelled) {
                    return;
                }
                setMeta(metaResponse);
                setDatasetStats(Object.fromEntries(datasetResponse.datasets.map((dataset) => [dataset.id, dataset])));
                setSelection((current) => current ?? { kind: "generator", id: metaResponse.generators[0]?.id ?? "" });
            })
            .catch((loadError) => {
                if (!cancelled) {
                    setError(loadError instanceof Error ? loadError.message : "Failed to load app metadata.");
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
    }, [refreshToken]);

    const selectedGenerator = meta?.generators.find((generator) => selection?.kind === "generator" && generator.id === selection.id);
    const selectedDataset = meta?.datasets.find((dataset) => selection?.kind === "dataset" && dataset.id === selection.id);

    return (
        <div className="app-shell" data-theme={theme}>
            <aside className="sidebar">
                <div className="brand">
                    <div>
                        <p className="eyebrow">Fake Data Studio</p>
                        <h1>Faked</h1>
                    </div>
                    <button className="button secondary small" type="button" onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}>
                        {theme === "dark" ? "Light" : "Dark"}
                    </button>
                </div>

                <nav className="nav-section">
                    <p className="nav-label">Builders</p>
                    <button
                        className={`nav-item ${selection?.kind === "builder" ? "active" : ""}`}
                        type="button"
                        onClick={() => setSelection({ kind: "builder", id: "batch" })}
                    >
                        <span>Record Builder</span>
                        <strong>Batch</strong>
                    </button>
                </nav>

                <nav className="nav-section">
                    <p className="nav-label">Generators</p>
                    {meta?.generators.map((generator) => (
                        <button
                            key={generator.id}
                            className={`nav-item ${selection?.kind === "generator" && selection.id === generator.id ? "active" : ""}`}
                            type="button"
                            onClick={() => setSelection({ kind: "generator", id: generator.id })}
                        >
                            <span>{generator.label}</span>
                        </button>
                    ))}
                </nav>

                <nav className="nav-section">
                    <p className="nav-label">Datasets</p>
                    {meta?.datasets.map((dataset) => (
                        <button
                            key={dataset.id}
                            className={`nav-item ${selection?.kind === "dataset" && selection.id === dataset.id ? "active" : ""}`}
                            type="button"
                            onClick={() => setSelection({ kind: "dataset", id: dataset.id })}
                        >
                            <span>{dataset.label}</span>
                            <strong>{datasetStats[dataset.id]?.count ?? 0}</strong>
                        </button>
                    ))}
                </nav>
            </aside>

            <main className="main-content">
                {loading ? <div className="card hero-card"><p>Loading metadata...</p></div> : null}
                {error ? <div className="banner error standalone">{error}</div> : null}
                {!loading && !error && selection?.kind === "builder" && meta ? <BatchBuilderPanel generators={meta.generators} /> : null}
                {!loading && !error && selectedGenerator ? <GeneratorPanel definition={selectedGenerator} /> : null}
                {!loading && !error && selectedDataset ? (
                    <DatasetPanel
                        definition={selectedDataset}
                        refreshToken={refreshToken}
                        onMutated={() => setRefreshToken((value) => value + 1)}
                    />
                ) : null}
            </main>
        </div>
    );
}