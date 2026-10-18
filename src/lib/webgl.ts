let cached: boolean | undefined;

/** Returns true if the browser can create a WebGL2 or WebGL context. Client-only; cached. */
export function isWebGLAvailable(): boolean {
  if (cached !== undefined) return cached;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    cached = gl !== null;
  } catch {
    cached = false;
  }
  return cached;
}

export type RenderQuality = "high" | "low";

let cachedQuality: RenderQuality | undefined;

/**
 * Picks a rendering tier. Software rasterizers (no usable GPU) get the low tier:
 * no light shafts or MSAA, lower pixel ratio and reflection resolution.
 */
export function detectRenderQuality(): RenderQuality {
  if (cachedQuality) return cachedQuality;
  cachedQuality = "high";
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    const info = gl?.getExtension("WEBGL_debug_renderer_info");
    const renderer = info && gl ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    if (/swiftshader|llvmpipe|softpipe|software|microsoft basic render/i.test(renderer)) cachedQuality = "low";
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    cachedQuality = "low";
  }
  return cachedQuality;
}
