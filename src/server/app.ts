import { datasetEntriesToCsv, listDatasets, readDataset, replaceDataset, validateDatasetEntry, writeDatasetEntry } from "./admin/datasets.ts";
import { getMeta } from "./meta/catalog.ts";
import { registerRoutes } from "./routes/register.ts";
import { normalizePathname } from "./utils/path.ts";
import { isServiceError, ServiceError } from "./validation/errors.ts";
import { parseEnvText } from "./utils/env.ts";
import { pingMongo, logAudit } from "./utils/mongo.ts";

async function readJsonBody(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";
  if ((request.method === "POST" || request.method === "PUT") && !contentType.includes("application/json")) {
    throw new ServiceError(400, "INVALID_CONTENT_TYPE", "Request content-type must be application/json.");
  }
  const raw = await request.text();
  if (raw.trim() === "") {
    return {};
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new ServiceError(400, "INVALID_JSON", "Request body contains invalid JSON.");
  }
}

function json<T>(body: T, init?: ResponseInit): Response {
  return Response.json(body, init);
}

function splitDatasetPath(pathname: string): string[] | null {
  const prefix = "/api/v1/admin/datasets/";
  if (!pathname.startsWith(prefix)) {
    return null;
  }
  const suffix = pathname.slice(prefix.length);
  return suffix.split("/").filter(Boolean).map((part) => decodeURIComponent(part));
}

function parseIndex(value: string): number {
  const index = Number(value);
  if (!Number.isInteger(index) || index < 0) {
    throw new ServiceError(400, "INVALID_INDEX", "Dataset entry index must be a non-negative integer.");
  }
  return index;
}

async function handleAdminRequest(request: Request, url: URL, pathname: string): Promise<Response | null> {
  if (pathname === "/api/v1/admin/datasets" && request.method === "GET") {
    return json({ datasets: await listDatasets() });
  }

  const parts = splitDatasetPath(pathname);
  if (!parts || parts.length === 0) {
    return null;
  }

  const datasetId = parts[0];

  if (parts.length === 1) {
    if (request.method === "GET") {
      return json(await readDataset(datasetId));
    }
    if (request.method === "POST") {
      const body = await readJsonBody(request);
      const created = await writeDatasetEntry(datasetId, null, body);
      return json(created, { status: 201 });
    }
  }

  if (parts.length === 2 && parts[1] === "import" && request.method === "POST") {
    const body = await readJsonBody(request);
    if (!Array.isArray(body)) {
      throw new ServiceError(400, "INVALID_REQUEST", "Imported dataset payload must be a JSON array.");
    }
    const result = await replaceDataset(datasetId, body);
    return json(result);
  }

  if (parts.length === 2 && parts[1] === "export" && request.method === "GET") {
    const dataset = await readDataset(datasetId);
    const format = url.searchParams.get("format") ?? "json";
    if (format === "csv") {
      return new Response(datasetEntriesToCsv(dataset.entries), {
        status: 200,
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename="${datasetId.replace(/\//g, "-")}.csv"`,
        },
      });
    }
    return json(dataset, {
      headers: {
        "content-disposition": `attachment; filename="${datasetId.replace(/\//g, "-")}.json"`,
      },
    });
  }

  if (parts.length === 2 && parts[1] === "validate" && request.method === "POST") {
    const body = await readJsonBody(request);
    const validation = Array.isArray(body)
      ? body.map((entry, index) => validateDatasetEntry(datasetId, entry, index))
      : [validateDatasetEntry(datasetId, body, 0)];
    return json({ valid: true, entries: validation });
  }

  if (parts.length === 2 && (request.method === "PUT" || request.method === "DELETE")) {
    const index = parseIndex(parts[1]);
    if (request.method === "DELETE") {
      const result = await writeDatasetEntry(datasetId, index, undefined, true);
      return json(result);
    }
    const body = await readJsonBody(request);
    return json(await writeDatasetEntry(datasetId, index, body));
  }

  return null;
}

export function createHandler(): (request: Request) => Promise<Response> {
  const routes = new Map(registerRoutes().map((route) => [route.path, route.handle]));

  // Rate limiting state: simple fixed-window per-ip counter
  const rateState = new Map<string, { windowStart: number; count: number }>();
  const fileEnv = (() => {
    try {
      const url = new URL("../../../.env", import.meta.url);
      return parseEnvText(Deno.readTextFileSync(url));
    } catch {
      return {};
    }
  })();
  const RATE_LIMIT_MAX = Number(Deno.env.get("RATE_LIMIT_MAX") ?? fileEnv.RATE_LIMIT_MAX ?? 120);
  const RATE_LIMIT_WINDOW = Number(Deno.env.get("RATE_LIMIT_WINDOW") ?? fileEnv.RATE_LIMIT_WINDOW ?? 60);

  async function listLocales(): Promise<Record<string, string[]>> {
    const dataRoot = new URL("../../../data", import.meta.url);
    const res: Record<string, string[]> = {};
    try {
      for await (const dirEntry of Deno.readDir(dataRoot)) {
        if (!dirEntry.isDirectory) continue;
        const folder = dirEntry.name;
        const entries: string[] = [];
        const folderPath = new URL(`../../../data/${folder}`, import.meta.url);
        try {
          for await (const f of Deno.readDir(folderPath)) {
            if (f.isFile && f.name.endsWith(".json")) {
              entries.push(f.name.replace(/\.json$/, ""));
            }
          }
        } catch {
          // ignore
        }
        res[folder] = entries;
      }
    } catch {
      // ignore directory errors
    }
    return res;
  }

  return async (request: Request): Promise<Response> => {
    const start = Date.now();
    let status = 200;
    let resp: Response | null = null;
    try {
      const url = new URL(request.url);
      const pathname = normalizePathname(url.pathname);

      // Liveness endpoint (process is alive)
      if (pathname === "/health" && request.method === "GET") {
        resp = json({ status: "ok", pid: Deno.pid, uptime: Math.round(performance.now()) });
        status = 200;
        return resp;
      }

      // Readiness endpoint: reports whether dependencies (Mongo) are available.
      // Optional query: wait=true&timeout=SECONDS will poll until ready or timeout.
      if (pathname === "/ready" && request.method === "GET") {
        const wait = url.searchParams.get("wait") === "true";
        const timeoutParam = Number(url.searchParams.get("timeout") ?? "30");
        const timeout = Number.isFinite(timeoutParam) && timeoutParam > 0 ? timeoutParam : 30;
        if (!wait) {
          const mongoOk = await pingMongo();
          if (mongoOk) {
            resp = json({ ready: true, mongo: true });
            status = 200;
            return resp;
          }
          resp = json({ ready: false, mongo: false }, { status: 503 });
          status = 503;
          return resp;
        }

        // wait mode: poll pingMongo until success or timeout
        const startWait = Date.now();
        const deadline = startWait + timeout * 1000;
        let ok = false;
        while (Date.now() < deadline) {
          // eslint-disable-next-line no-await-in-loop
          ok = await pingMongo();
          if (ok) break;
          // sleep 500ms
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 500));
        }
        if (ok) {
          resp = json({ ready: true, mongo: true });
          status = 200;
          return resp;
        }
        resp = json({ ready: false, mongo: false }, { status: 503 });
        status = 503;
        return resp;
      }

      // Heartbeat
      if (pathname === "/heartbeat" && request.method === "GET") {
        resp = json({ timestamp: new Date().toISOString(), pid: Deno.pid, uptime: Math.round(performance.now()) });
        status = 200;
        return resp;
      }

      // Locales listing
      if (pathname === "/api/v1/locales" && request.method === "GET") {
        const locales = await listLocales();
        resp = json(locales);
        status = 200;
        return resp;
      }

      if (pathname === "/api/v1/meta" && request.method === "GET") {
        resp = json(getMeta());
        return resp;
      }

      const adminResponse = await handleAdminRequest(request, url, pathname);
      if (adminResponse) {
        resp = adminResponse;
        return resp;
      }

      // Simple rate limiting by IP
      const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
      const now = Math.floor(Date.now() / 1000);
      const state = rateState.get(ip) ?? { windowStart: now, count: 0 };
      if (now - state.windowStart >= RATE_LIMIT_WINDOW) {
        state.windowStart = now;
        state.count = 0;
      }
      state.count += 1;
      rateState.set(ip, state);
      if (state.count > RATE_LIMIT_MAX) {
        status = 429;
        resp = json({ error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many requests." } }, { status });
        return resp;
      }

      if (request.method !== "POST") {
        status = 404;
        resp = json(
          { error: { code: "NOT_FOUND", message: "Endpoint not found." } },
          { status: 404 },
        );
        return resp;
      }

      const route = routes.get(pathname);
      if (!route) {
        status = 404;
        resp = json(
          { error: { code: "NOT_FOUND", message: "Endpoint not found." } },
          { status: 404 },
        );
        return resp;
      }

      const body = await readJsonBody(request);
      resp = await route(body);
      status = resp.status ?? 200;
      return resp;
    } catch (error) {
      if (isServiceError(error)) {
        status = error.status;
        resp = error.toResponse();
        return resp;
      }
      status = 500;
      resp = json(
        { error: { code: "INTERNAL_ERROR", message: "Unexpected server error." } },
        { status: 500 },
      );
      return resp;
    } finally {
      // best-effort audit log
      try {
        const duration = Date.now() - start;
        const url = new URL(request.url);
        const pathname = normalizePathname(url.pathname);
        const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
        const entry: Record<string, unknown> = {
          method: request.method,
          path: pathname,
          ip,
          status,
          duration,
        };
        // non-blocking
        logAudit(entry).catch(() => undefined);
      } catch {
        // ignore
      }
    }
  };
}