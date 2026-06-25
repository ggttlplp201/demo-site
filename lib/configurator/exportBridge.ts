export type ExportFn = () => Promise<ArrayBuffer>;

let handler: ExportFn | null = null;

/** SceneExporter registers (and on unmount clears) the export implementation. */
export function registerExportHandler(fn: ExportFn | null): void {
  handler = fn;
}

/** DOM-side orchestration calls this to export the live scene to a binary .glb. */
export function runExport(): Promise<ArrayBuffer> {
  if (!handler) return Promise.reject(new Error("export handler not ready"));
  return handler();
}
