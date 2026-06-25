import { describe, it, expect } from "vitest";
import { hdriUrls, requestOrigin } from "./photoreal";

describe("hdriUrls", () => {
  it("builds absolute day/night EXR urls from an origin", () => {
    expect(hdriUrls("https://x.com")).toEqual({
      day: "https://x.com/hdris/DaySkyHDRI063B_2K_HDR.exr",
      night: "https://x.com/hdris/NightSkyHDRI003_2K_HDR.exr",
    });
  });
});

describe("requestOrigin", () => {
  it("prefers x-forwarded-host + x-forwarded-proto", () => {
    const req = new Request("http://internal.local/api/render-tour", {
      headers: {
        "x-forwarded-host": "example.com",
        "x-forwarded-proto": "https",
      },
    });
    expect(requestOrigin(req)).toBe("https://example.com");
  });

  it("falls back to host header with default https when no forwarded-proto", () => {
    const req = new Request("http://internal.local/api/render-tour", {
      headers: {
        "host": "example.com",
      },
    });
    expect(requestOrigin(req)).toBe("https://example.com");
  });

  it("falls back to new URL(req.url).origin when no host headers at all", () => {
    const req = new Request("http://internal.local/api/render-tour");
    expect(requestOrigin(req)).toBe("http://internal.local");
  });
});
