import { parseEnvText } from "./env.ts";

// Lazy import of deno_mongo client to avoid hard runtime dependency if unused.
let client: any = null;
let db: any = null;

function getEnv(): Record<string, string> {
    try {
        const url = new URL("../../../.env", import.meta.url);
        const text = Deno.readTextFileSync(url);
        return parseEnvText(text);
    } catch {
        return {};
    }
}

export async function connectMongo(): Promise<boolean> {
    if (db) return true;
    const fileValues = getEnv();
    const url = Deno.env.get("MONGODB_URL") ?? fileValues.MONGODB_URL;
    if (!url) return false;
    const mod = await import("https://deno.land/x/mongo@0.33.0/mod.ts");
    const { MongoClient } = mod;
    client = new MongoClient();
    await client.connect(url);
    try {
        const dbName = new URL(url).pathname.replace(/^\//, "") || "faked";
        db = client.database(dbName);
    } catch {
        db = client.database("faked");
    }
    return true;
}

export function getDb() {
    if (!db) throw new Error("MongoDB not connected");
    return db;
}

export async function pingMongo(): Promise<boolean> {
    try {
        if (!db) {
            const ok = await connectMongo();
            if (!ok) return false;
        }
        // run a ping command
        // deno_mongo supports database.command
        // some drivers may not; guard with try
        try {
            // @ts-ignore
            await db.command({ ping: 1 });
            return true;
        } catch {
            return false;
        }
    } catch {
        return false;
    }
}

export async function logAudit(entry: Record<string, unknown>): Promise<void> {
    try {
        if (!db) {
            const ok = await connectMongo();
            if (!ok) {
                // fallback to file logging
                await Deno.writeTextFile("/tmp/faked-audit.log", JSON.stringify(entry) + "\n", { append: true });
                return;
            }
        }
        const collection = db.collection("audit_logs");
        await collection.insertOne({ ...entry, timestamp: new Date() });
    } catch (err) {
        // best-effort file fallback
        try {
            await Deno.writeTextFile("/tmp/faked-audit.log", JSON.stringify({ error: String(err), entry }) + "\n", { append: true });
        } catch {
            // swallow
        }
    }
}

export async function closeMongo(): Promise<void> {
    try {
        if (client && client.close) {
            await client.close();
        }
    } catch {
        // ignore
    }
}
