import type {
  CustomLayerInterface,
  CustomRenderMethodInput,
  FillLayerSpecification,
  Map as MLMap,
  StyleImageInterface,
} from 'maplibre-gl'

/**
 * Decorative, procedurally authored atmosphere. These are stylised clouds and
 * water highlights, not satellite imagery, live weather or measured currents.
 * Clouds use MapLibre's own globe projection and sit 8 km above its sphere;
 * the water pattern is painted only inside the provider's water polygons.
 */
const CLOUD_LAYER = 'journey-illustrative-clouds'
const OCEAN_IMAGE = 'journey-illustrative-ocean'
const FPS = 15
const CLOUD_WIDTH = 256
const CLOUD_HEIGHT = 128
const installations = new WeakMap<MLMap, () => void>()
type FillPattern = NonNullable<FillLayerSpecification['paint']>['fill-pattern']

function smoothstep(low: number, high: number, value: number): number {
  const t = Math.max(0, Math.min(1, (value - low) / (high - low)))
  return t * t * (3 - 2 * t)
}

function hash(x: number, y: number): number {
  // Deterministic noise: repeat visits and reduced-motion stills are stable.
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}

function noise(x: number, y: number): number {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const u = smoothstep(0, 1, x - ix)
  const v = smoothstep(0, 1, y - iy)
  const a = hash(ix, iy) * (1 - u) + hash(ix + 1, iy) * u
  const b = hash(ix, iy + 1) * (1 - u) + hash(ix + 1, iy + 1) * u
  return a * (1 - v) + b * v
}

function cloudPixels(): Uint8Array {
  const pixels = new Uint8Array(CLOUD_WIDTH * CLOUD_HEIGHT * 4)
  for (let y = 0; y < CLOUD_HEIGHT; y++) {
    const latitude = y / CLOUD_HEIGHT
    for (let x = 0; x < CLOUD_WIDTH; x++) {
      const longitude = x / CLOUD_WIDTH
      // Blend the longitude seam; shapes move around a sphere, never a screen.
      const sample = (scale: number) => {
        const a = noise(longitude * scale, latitude * scale * 0.55)
        const b = noise((longitude - 1) * scale, latitude * scale * 0.55)
        return a * (1 - longitude) + b * longitude
      }
      const n = sample(10) * 0.55 + sample(23) * 0.3 + sample(49) * 0.15
      const band = 0.74 + 0.26 * Math.sin(latitude * Math.PI * 5 + Math.sin(longitude * Math.PI * 2))
      const coverage = smoothstep(0.48, 0.75, n * band)
      const index = (y * CLOUD_WIDTH + x) * 4
      pixels[index] = 226
      pixels[index + 1] = 246
      pixels[index + 2] = 255
      pixels[index + 3] = Math.round(coverage * 255)
    }
  }
  return pixels
}

function paintOcean(pixels: Uint8Array, seconds: number): void {
  const tau = Math.PI * 2
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      // Integer spatial periods make the 64 px tile seamless in both axes.
      // Long, low-contrast meanders instead of crossing highlight grids: the
      // latter read as repeating bumps when a small tile wraps the whole globe.
      const meander = Math.sin(tau * y / 64 + seconds * 0.08) * 0.55
      const wave = Math.sin(tau * (x + y) / 64 + meander - seconds * 0.34)
      const sheen = Math.sin(tau * (x * 2 + y) / 64 + seconds * 0.17) * 0.25
      const broad = (wave + sheen) * 0.5
      const crest = smoothstep(0.7, 1, wave)
      const index = (y * 64 + x) * 4
      pixels[index] = Math.round(5 + broad + crest)
      pixels[index + 1] = Math.round(87 + broad * 2 + crest * 3)
      pixels[index + 2] = Math.round(137 + broad * 3 + crest * 4)
      pixels[index + 3] = 255
    }
  }
}

interface CloudProgram {
  program: WebGLProgram
  matrix: WebGLUniformLocation | null
  mercator: WebGLUniformLocation | null
  clipping: WebGLUniformLocation | null
  transition: WebGLUniformLocation | null
  fallback: WebGLUniformLocation | null
  clock: WebGLUniformLocation | null
  alpha: WebGLUniformLocation | null
  sampler: WebGLUniformLocation | null
}

function compileShader(gl: WebGL2RenderingContext, kind: number, source: string): WebGLShader {
  const shader = gl.createShader(kind)
  if (!shader) throw new Error('Cloud shader allocation unavailable')
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? 'Cloud shader compile failed'
    gl.deleteShader(shader)
    throw new Error(message)
  }
  return shader
}

function makeProgram(gl: WebGL2RenderingContext, input: CustomRenderMethodInput): CloudProgram {
  const vertex = `#version 300 es
precision highp float;
${input.shaderData.vertexShaderPrelude}
${input.shaderData.define}
layout(location = 0) in vec2 a_position;
uniform float u_cloud_clock;
out vec2 v_cloud_uv;
out float v_cloud_horizon;
void main() {
  v_cloud_uv = vec2(a_position.x + u_cloud_clock * 0.0013, a_position.y);
  v_cloud_horizon = 1.0;
  #ifdef GLOBE
    float longitude = a_position.x * PI * 2.0 + PI;
    float latitude = 2.0 * atan(exp(PI - a_position.y * PI * 2.0)) - PI * 0.5;
    vec3 sphere = vec3(sin(longitude) * cos(latitude), sin(latitude), cos(longitude) * cos(latitude));
    v_cloud_horizon = dot(sphere, u_projection_clipping_plane.xyz) + u_projection_clipping_plane.w;
  #endif
  gl_Position = projectTileFor3D(a_position, 8000.0);
}`
  const fragment = `#version 300 es
precision highp float;
uniform sampler2D u_cloud_texture;
uniform float u_cloud_alpha;
in vec2 v_cloud_uv;
in float v_cloud_horizon;
out vec4 fragColor;
void main() {
  // Explicit horizon clipping prevents the back hemisphere showing through.
  if (v_cloud_horizon <= 0.0) discard;
  float cloud = texture(u_cloud_texture, v_cloud_uv).a;
  float edge = smoothstep(0.0, 0.12, v_cloud_horizon);
  float alpha = cloud * u_cloud_alpha * edge;
  if (alpha < 0.002) discard;
  fragColor = vec4(vec3(0.86, 0.96, 1.0) * alpha, alpha);
}`
  const vert = compileShader(gl, gl.VERTEX_SHADER, vertex)
  let frag: WebGLShader | null = null
  let program: WebGLProgram | null = null
  try {
    frag = compileShader(gl, gl.FRAGMENT_SHADER, fragment)
    program = gl.createProgram()
    if (!program) throw new Error('Cloud program allocation unavailable')
    gl.attachShader(program, vert)
    gl.attachShader(program, frag)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) ?? 'Cloud program link failed')
    }
    const at = (name: string) => gl.getUniformLocation(program!, name)
    return {
      program, matrix: at('u_projection_matrix'), mercator: at('u_projection_tile_mercator_coords'),
      clipping: at('u_projection_clipping_plane'), transition: at('u_projection_transition'),
      fallback: at('u_projection_fallback_matrix'), clock: at('u_cloud_clock'),
      alpha: at('u_cloud_alpha'), sampler: at('u_cloud_texture'),
    }
  } catch (error) {
    if (program) gl.deleteProgram(program)
    throw error
  } finally {
    gl.deleteShader(vert)
    if (frag) gl.deleteShader(frag)
  }
}

function cloudMesh(): { vertices: Float32Array; indices: Uint16Array } {
  // Chords between coarse vertices sag into the globe. At this resolution the
  // largest facet stays above the surface beneath an 8 km cloud shell, avoiding
  // depth intersections while keeping the static mesh below 17k triangles.
  const longitudeSteps = 128
  const latitudeSteps = 64
  const vertices: number[] = []
  const indices: number[] = []
  for (let y = 0; y <= latitudeSteps; y++) {
    const latitude = -85 + y / latitudeSteps * 170
    const radians = latitude * Math.PI / 180
    const mercatorY = (1 - Math.log(Math.tan(Math.PI / 4 + radians / 2)) / Math.PI) / 2
    for (let x = 0; x <= longitudeSteps; x++) vertices.push(x / longitudeSteps, mercatorY)
  }
  for (let y = 0; y < latitudeSteps; y++) {
    for (let x = 0; x < longitudeSteps; x++) {
      const a = y * (longitudeSteps + 1) + x
      const b = a + longitudeSteps + 1
      indices.push(a, b, a + 1, a + 1, b, b + 1)
    }
  }
  return { vertices: new Float32Array(vertices), indices: new Uint16Array(indices) }
}

class GlobeCloudLayer implements CustomLayerInterface {
  id = CLOUD_LAYER
  type = 'custom' as const
  renderingMode = '3d' as const
  private gl: WebGL2RenderingContext | null = null
  private vertexBuffer: WebGLBuffer | null = null
  private indexBuffer: WebGLBuffer | null = null
  private texture: WebGLTexture | null = null
  private vao: WebGLVertexArrayObject | null = null
  private programs = new Map<string, CloudProgram>()
  private indexCount = 0
  private unavailable = false
  private matrix = new Float32Array(16)
  private fallback = new Float32Array(16)

  constructor(private readonly map: MLMap, private readonly time: () => number) {}

  onAdd(_map: MLMap, gl: WebGL2RenderingContext): void {
    try {
      this.allocate(gl)
    } catch {
      this.release()
      this.unavailable = true
      this.map.getCanvas().dataset.globeClouds = 'unavailable'
    }
  }

  private allocate(gl: WebGL2RenderingContext): void {
    if (gl.isContextLost() || this.vertexBuffer || this.unavailable) return
    if (typeof gl.createVertexArray !== 'function') {
      this.unavailable = true
      return
    }
    this.gl = gl
    const previousVao = gl.getParameter(gl.VERTEX_ARRAY_BINDING) as WebGLVertexArrayObject | null
    const previousArrayBuffer = gl.getParameter(gl.ARRAY_BUFFER_BINDING) as WebGLBuffer | null
    const previousActiveTexture = gl.getParameter(gl.ACTIVE_TEXTURE) as number
    gl.activeTexture(gl.TEXTURE0)
    const previousTexture = gl.getParameter(gl.TEXTURE_BINDING_2D) as WebGLTexture | null
    const mesh = cloudMesh()
    this.vao = gl.createVertexArray()
    this.vertexBuffer = gl.createBuffer()
    this.indexBuffer = gl.createBuffer()
    this.texture = gl.createTexture()
    if (!this.vao || !this.vertexBuffer || !this.indexBuffer || !this.texture) {
      this.release()
      this.unavailable = true
      gl.activeTexture(previousActiveTexture)
      return
    }
    try {
      gl.bindVertexArray(this.vao)
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW)
      gl.enableVertexAttribArray(0)
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer)
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW)
      this.indexCount = mesh.indices.length
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, this.texture)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, CLOUD_WIDTH, CLOUD_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, cloudPixels())
    } finally {
      // onAdd runs outside a custom draw pass, so preserve the host's GL state.
      gl.bindVertexArray(previousVao)
      gl.bindBuffer(gl.ARRAY_BUFFER, previousArrayBuffer)
      gl.bindTexture(gl.TEXTURE_2D, previousTexture)
      gl.activeTexture(previousActiveTexture)
    }
  }

  render(gl: WebGL2RenderingContext, input: CustomRenderMethodInput): void {
    if (this.unavailable || gl.isContextLost() || input.defaultProjectionData.projectionTransition < 0.5) return
    try {
      this.allocate(gl)
      if (!this.vao || !this.texture) return
      let program = this.programs.get(input.shaderData.variantName)
      if (!program) {
        program = makeProgram(gl, input)
        this.programs.set(input.shaderData.variantName, program)
      }
      const projection = input.defaultProjectionData
      this.matrix.set(projection.mainMatrix)
      this.fallback.set(projection.fallbackMatrix)
      gl.useProgram(program.program)
      gl.uniformMatrix4fv(program.matrix, false, this.matrix)
      gl.uniformMatrix4fv(program.fallback, false, this.fallback)
      gl.uniform4fv(program.mercator, projection.tileMercatorCoords)
      gl.uniform4fv(program.clipping, projection.clippingPlane)
      gl.uniform1f(program.transition, projection.projectionTransition)
      gl.uniform1f(program.clock, this.time())
      // Do not veil close-up unit maps; atmosphere belongs to the world view.
      gl.uniform1f(program.alpha, 0.18 * (1 - smoothstep(2.5, 4, this.map.getZoom())))
      gl.uniform1i(program.sampler, 0)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, this.texture)
      gl.bindVertexArray(this.vao)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
      gl.enable(gl.DEPTH_TEST)
      gl.depthFunc(gl.LEQUAL)
      gl.depthMask(false)
      gl.disable(gl.CULL_FACE)
      gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0)
      gl.bindVertexArray(null)
      this.map.getCanvas().dataset.globeClouds = 'ready'
    } catch (error) {
      // Optional decoration must never prevent the map, route or story working.
      this.unavailable = true
      this.release()
      this.map.getCanvas().dataset.globeClouds = 'unavailable'
      console.warn('[globe] Illustrative cloud rendering unavailable:', error)
    }
  }

  reset(): void {
    this.release()
    this.unavailable = false
  }

  onRemove(): void { this.release() }

  private release(): void {
    const gl = this.gl
    if (gl && !gl.isContextLost()) {
      if (this.vertexBuffer) gl.deleteBuffer(this.vertexBuffer)
      if (this.indexBuffer) gl.deleteBuffer(this.indexBuffer)
      if (this.texture) gl.deleteTexture(this.texture)
      if (this.vao) gl.deleteVertexArray(this.vao)
      this.programs.forEach(program => gl.deleteProgram(program.program))
    }
    this.programs.clear()
    this.vertexBuffer = this.indexBuffer = null
    this.texture = null
    this.vao = null
    this.gl = null
  }
}

/** Install once per map. Calling again replaces this instance; cleanup is safe twice. */
export function installGlobeAtmosphere(map: MLMap, reduced: boolean): () => void {
  installations.get(map)?.()
  let disposed = false
  let clock = 0
  let lastTick = performance.now()
  let timer: number | null = null
  let waveFrame = -1
  const originalPatterns = new Map<string, FillPattern>()
  const cloudLayer = new GlobeCloudLayer(map, () => reduced ? 0 : clock)
  const pixels = new Uint8Array(64 * 64 * 4)
  paintOcean(pixels, 0)
  const ocean: StyleImageInterface = {
    width: 64, height: 64, data: pixels,
    render: () => {
      const frame = reduced ? 0 : Math.floor(clock * FPS)
      if (frame === waveFrame) return false
      waveFrame = frame
      paintOcean(pixels, reduced ? 0 : clock)
      return true
    },
  }
  const app = map.getContainer().closest<HTMLElement>('.app')
  const active = () => {
    const phase = app?.dataset.phase
    return !disposed && !document.hidden && phase !== 'dateEntry' && phase !== 'idle'
  }
  const stopTimer = () => {
    if (timer !== null) window.clearInterval(timer)
    timer = null
  }
  const syncAnimation = () => {
    stopTimer()
    lastTick = performance.now()
    if (reduced || !active()) return
    timer = window.setInterval(() => {
      const now = performance.now()
      clock += Math.min(0.15, (now - lastTick) / 1000)
      lastTick = now
      if (!disposed) map.triggerRepaint()
    }, 1000 / FPS)
  }
  const install = () => {
    if (disposed || !map.getStyle()) return
    try {
      if (!map.hasImage(OCEAN_IMAGE)) map.addImage(OCEAN_IMAGE, ocean, { pixelRatio: 1 })
      let waterLayers = 0
      for (const layer of map.getStyle().layers) {
        if (layer.type !== 'fill') continue
        const sourceLayer = 'source-layer' in layer ? layer['source-layer'] : ''
        const isWater = sourceLayer === 'water' || /^(water|ocean)([-_].*)?$/.test(layer.id)
        if (!isWater) continue
        if (!originalPatterns.has(layer.id)) originalPatterns.set(layer.id, map.getPaintProperty(layer.id, 'fill-pattern'))
        map.setPaintProperty(layer.id, 'fill-pattern', OCEAN_IMAGE)
        waterLayers++
      }
      if (!map.getLayer(CLOUD_LAYER)) {
        const layers = map.getStyle().layers
        const before = map.getLayer('journey-arc-glow') ? 'journey-arc-glow' : layers.find(layer => layer.type === 'symbol')?.id
        map.addLayer(cloudLayer, before)
      }
      map.getCanvas().dataset.globeOcean = waterLayers > 0 ? 'ready' : 'no-water-mask'
      map.getCanvas().dataset.globeOceanLayers = String(waterLayers)
      map.triggerRepaint()
    } catch (error) {
      // WebGL or a missing provider water layer is not a fatal application error.
      console.warn('[globe] Optional atmosphere installation unavailable:', error)
    }
  }
  const onStyle = () => {
    originalPatterns.clear()
    // MapView's provider palette and route layers finish before we choose order.
    queueMicrotask(install)
  }
  const onLost = () => { stopTimer(); cloudLayer.reset() }
  const onRestored = () => { cloudLayer.reset(); queueMicrotask(install); syncAnimation() }
  map.on('style.load', onStyle)
  map.on('webglcontextlost', onLost)
  map.on('webglcontextrestored', onRestored)
  document.addEventListener('visibilitychange', syncAnimation)
  const observer = app ? new MutationObserver(syncAnimation) : null
  if (app) observer?.observe(app, { attributes: true, attributeFilter: ['data-phase'] })
  if (map.isStyleLoaded()) queueMicrotask(install)
  syncAnimation()

  const cleanup = () => {
    if (disposed) return
    disposed = true
    stopTimer()
    observer?.disconnect()
    document.removeEventListener('visibilitychange', syncAnimation)
    map.off('style.load', onStyle)
    map.off('webglcontextlost', onLost)
    map.off('webglcontextrestored', onRestored)
    try {
      if (map.getLayer(CLOUD_LAYER)) map.removeLayer(CLOUD_LAYER)
      for (const [id, pattern] of originalPatterns) {
        if (map.getLayer(id)) map.setPaintProperty(id, 'fill-pattern', pattern)
      }
      if (map.hasImage(OCEAN_IMAGE)) map.removeImage(OCEAN_IMAGE)
      delete map.getCanvas().dataset.globeClouds
      delete map.getCanvas().dataset.globeOcean
      delete map.getCanvas().dataset.globeOceanLayers
    } catch { /* The owning map may already have been removed. */ }
    cloudLayer.reset()
    if (installations.get(map) === cleanup) installations.delete(map)
  }
  installations.set(map, cleanup)
  return cleanup
}
