import { describe, it, expect, beforeEach } from "vitest";
import { registerExportHandler, runExport } from "./exportBridge";

describe("exportBridge", () => {
  beforeEach(() => registerExportHandler(null));

  it("throws when no handler is registered", async () => {
    await expect(runExport()).rejects.toThrow("export handler not ready");
  });

  it("delegates to the registered handler", async () => {
    const buf = new ArrayBuffer(8);
    registerExportHandler(async () => buf);
    expect(await runExport()).toBe(buf);
  });
});
