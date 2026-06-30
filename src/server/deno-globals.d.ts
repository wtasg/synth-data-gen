declare namespace Deno {
    namespace errors {
        class NotFound extends Error { }
    }

    namespace env {
        function get(key: string): string | undefined;
    }

    function readTextFile(path: string | URL): Promise<string>;
    function writeTextFile(path: string | URL, data: string): Promise<void>;
    function serve(
        options: { hostname?: string; port: number },
        handler: (request: Request) => Response | Promise<Response>,
    ): void;
}