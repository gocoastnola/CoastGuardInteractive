/** Resolve bundled public assets at the Vite base, including GitHub Pages subpaths. */
export function publicAsset(src: string, base = import.meta.env.BASE_URL): string {
  if (!src.startsWith('/') || src.startsWith('//')) return src
  const prefix = `${base.replace(/\/$/, '')}/`
  if (prefix !== '/' && src.startsWith(prefix)) return src
  return `${prefix}${src.slice(1)}`
}
