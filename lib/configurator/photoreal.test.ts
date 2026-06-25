import { describe, it, expect } from "vitest";
import { hdriUrls } from "./photoreal";

describe("hdriUrls", () => {
  it("builds absolute day/night EXR urls from an origin", () => {
    expect(hdriUrls("https://x.com")).toEqual({
      day: "https://x.com/hdris/DaySkyHDRI063B_2K_HDR.exr",
      night: "https://x.com/hdris/NightSkyHDRI003_2K_HDR.exr",
    });
  });
});
