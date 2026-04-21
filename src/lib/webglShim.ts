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

// Three.js WebGLState init does `new Vector4().fromArray(gl.getParameter(gl.SCISSOR_BOX))`
// and `...VIEWPORT`. iOS Safari/Chrome on degraded contexts (common on tablets) can
// return null here, crashing with "null is not an object (evaluating 'e[t]')" before
// the scene ever renders. Fall back to a zero Int32Array so fromArray succeeds.
//   SCISSOR_BOX = 0x0C10 (3088)
//   VIEWPORT    = 0x0BA2 (2978)
const ARRAY_PARAMETER_FALLBACKS: Record<number, () => Int32Array> = {
  0x0c10: () => new Int32Array([0, 0, 0, 0]),
  0x0ba2: () => new Int32Array([0, 0, 0, 0]),
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
      if (result == null) {
        const stringDefault = STRING_PARAMETER_DEFAULTS[pname];
        if (stringDefault !== undefined) return stringDefault;
        const arrayFallback = ARRAY_PARAMETER_FALLBACKS[pname];
        if (arrayFallback !== undefined) return arrayFallback();
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
