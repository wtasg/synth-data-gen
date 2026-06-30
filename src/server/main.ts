import { createHandler } from "./app.ts";
import { getServerConfig } from "./utils/env.ts";

const { host, port } = await getServerConfig();

if (import.meta.main) {
    Deno.serve({ hostname: host, port }, createHandler());
}