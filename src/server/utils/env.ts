function parseLine(line: string): [string, string] | null {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
        return null;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
        return null;
    }

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
    }

    return [key, value];
}

export function parseEnvText(text: string): Record<string, string> {
    const values: Record<string, string> = {};
    for (const line of text.split(/\r?\n/)) {
        const parsed = parseLine(line);
        if (!parsed) {
            continue;
        }
        const [key, value] = parsed;
        values[key] = value;
    }
    return values;
}

async function readEnvFile(): Promise<Record<string, string>> {
    const url = new URL("../../../.env", import.meta.url);
    try {
        return parseEnvText(await Deno.readTextFile(url));
    } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
            return {};
        }
        throw error;
    }
}

function parsePort(value: string | undefined, fallback: number): number {
    if (!value) {
        return fallback;
    }
    const port = Number(value);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error(`Invalid port '${value}'.`);
    }
    return port;
}

export async function getServerConfig(): Promise<{ host: string; port: number }> {
    const fileValues = await readEnvFile();
    return {
        host: Deno.env.get("SERVER_HOST") ?? fileValues.SERVER_HOST ?? "0.0.0.0",
        port: parsePort(Deno.env.get("SERVER_PORT") ?? fileValues.SERVER_PORT, 16010),
    };
}