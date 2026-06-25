export function photorealEnabled(): boolean {
  return !!process.env.MODAL_RENDER_URL;
}

/** Public origin of the incoming request, preferring proxy-forwarded headers
 *  (Vercel sets x-forwarded-host/proto) and falling back to the request URL. */
export function requestOrigin(req: Request): string {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return new URL(req.url).origin;
}

/** Absolute URLs to the day/night HDRIs the worker downloads (public static assets). */
export function hdriUrls(origin: string): { day: string; night: string } {
  return {
    day: `${origin}/hdris/DaySkyHDRI063B_2K_HDR.exr`,
    night: `${origin}/hdris/NightSkyHDRI003_2K_HDR.exr`,
  };
}
