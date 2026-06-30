const cache = new Map<string, Promise<unknown>>();

export function datasetUrl(relativePath: string): URL {
  return new URL(`../../../data/${relativePath}`, import.meta.url);
}

export async function loadDataset<T>(relativePath: string): Promise<T> {
  let pending = cache.get(relativePath) as Promise<T> | undefined;
  if (!pending) {
    pending = Deno.readTextFile(datasetUrl(relativePath)).then((text) =>
      JSON.parse(text) as T
    );
    cache.set(relativePath, pending);
  }
  return pending;
}

export function clearDatasetCache(relativePath?: string): void {
  if (relativePath) {
    cache.delete(relativePath);
    return;
  }
  cache.clear();
}

export async function saveDataset<T>(relativePath: string, data: T): Promise<void> {
  await Deno.writeTextFile(datasetUrl(relativePath), `${JSON.stringify(data, null, 2)}\n`);
  cache.set(relativePath, Promise.resolve(data));
}