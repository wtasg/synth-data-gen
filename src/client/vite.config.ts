import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
    const envDir = new URL("../..", import.meta.url).pathname;
    const env = loadEnv(mode, envDir, "");
    const clientPort = Number(env.CLIENT_PORT || "16011");
    const previewPort = Number(env.CLIENT_PREVIEW_PORT || "16012");
    const apiProxyHost = env.API_PROXY_HOST || "127.0.0.1";
    const apiProxyPort = Number(env.API_PROXY_PORT || env.SERVER_PORT || "16010");

    return {
        envDir,
        plugins: [react()],
        test: {
            environment: "jsdom",
        },
        server: {
            host: env.CLIENT_HOST || "0.0.0.0",
            port: clientPort,
            proxy: {
                "/api": {
                    target: `http://${apiProxyHost}:${apiProxyPort}`,
                    changeOrigin: true,
                },
            },
        },
        preview: {
            host: env.CLIENT_HOST || "0.0.0.0",
            port: previewPort,
        },
    };
});