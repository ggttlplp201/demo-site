export function photorealEnabled(): boolean {
  return !!process.env.MODAL_RENDER_URL;
}

/** Absolute URLs to the day/night HDRIs the worker downloads (public static assets). */
export function hdriUrls(origin: string): { day: string; night: string } {
  return {
    day: `${origin}/hdris/DaySkyHDRI063B_2K_HDR.exr`,
    night: `${origin}/hdris/NightSkyHDRI003_2K_HDR.exr`,
  };
}
