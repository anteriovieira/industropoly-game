// Patch around iOS Safari / iOS Chrome bugs where WebGL methods return `null`
// in places Three.js doesn't expect, crashing the renderer init.
//
// Two patched methods, both on WebGLRenderingContext.prototype AND
// WebGL2RenderingContext.prototype (modern iPads use WebGL2):
//
// 1. `getShaderPrecisionFormat()` — Three.js's WebGLCapabilities does
//    `gl.getShaderPrecisionFormat(...).precision`. iOS sometimes returns null.
//    Shim returns a conservative valid descriptor (precision: 23 = IEEE 754
//    single-precision significand size).
//
// 2. `getParameter()` — Three.js's WebGLState does `gl.getParameter(gl.VERSION)
//    .indexOf(...)` and similar string ops on a handful of parameters. iOS can
//    return null for these on degraded contexts. Shim returns sensible
//    defaults for the few parameter constants Three.js calls string ops on.

const PRECISION_FALLBACK: WebGLShaderPrecisionFormat = {
  precision: 23,
  rangeMin: 127,
  rangeMax: 127,
};

// Three.js calls .indexOf / .startsWith on these — must be strings.
// Constant numeric values come from the WebGL spec.
//   VERSION                  = 0x1F02 (7938)
//   SHADING_LANGUAGE_VERSION = 0x8B8C (35724)
//   VENDOR                   = 0x1F00 (7936)
//   RENDERER                 = 0x1F01 (7937)
const STRING_PARAMETER_DEFAULTS: Record<number, string> = {
  0x1f02: 'WebGL 1.0 (shim)',
  0x8b8c: 'WebGL GLSL ES 1.0 (shim)',
  0x1f00: 'shim',
  0x1f01: 'shim',
};

interface PatchableProto {
  getShaderPrecisionFormat?: (
    shaderType: number,
    precisionType: number,
  ) => WebGLShaderPrecisionFormat | null;
  getParameter?: (pname: number) => unknown;
  __precisionShim?: boolean;
}

function patchProto(proto: PatchableProto | undefined): void {
  if (!proto || proto.__precisionShim) return;

  const originalGsf = proto.getShaderPrecisionFormat;
  if (typeof originalGsf === 'function') {
    proto.getShaderPrecisionFormat = function (
      this: WebGLRenderingContext,
      shaderType: number,
      precisionType: number,
    ): WebGLShaderPrecisionFormat | null {
      const result = originalGsf.call(this, shaderType, precisionType);
      return result ?? PRECISION_FALLBACK;
    };
  }

  const originalGp = proto.getParameter;
  if (typeof originalGp === 'function') {
    proto.getParameter = function (this: WebGLRenderingContext, pname: number): unknown {
      const result = originalGp.call(this, pname);
      if (result == null && pname in STRING_PARAMETER_DEFAULTS) {
        return STRING_PARAMETER_DEFAULTS[pname];
      }
      return result;
    };
  }

  proto.__precisionShim = true;
}

export function installWebglPrecisionShim(): void {
  if (typeof window === 'undefined') return;
  patchProto(window.WebGLRenderingContext?.prototype as PatchableProto | undefined);
  patchProto(
    (window as unknown as { WebGL2RenderingContext?: { prototype: PatchableProto } })
      .WebGL2RenderingContext?.prototype,
  );
}
