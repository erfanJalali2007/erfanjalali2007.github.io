/**
 * Accurately determines if a string is a renderable image source for <img> tags.
 * Strictly excludes CSS gradients (linear-gradient, radial-gradient, etc.)
 * which cannot be loaded in an <img> src attribute and cause browser image loading errors.
 */
export function isRealImageSource(src: unknown): boolean {
  if (!src || typeof src !== 'string') return false;
  const s = src.trim();
  if (s.length < 4) return false;

  // Reject CSS gradients and color strings
  if (
    s.startsWith('radial-gradient') ||
    s.startsWith('linear-gradient') ||
    s.startsWith('conic-gradient') ||
    s.includes('gradient(') ||
    s.startsWith('rgba(') ||
    s.startsWith('rgb(') ||
    s.startsWith('hsl(') ||
    s.startsWith('#')
  ) {
    return false;
  }

  // Accept valid protocols and file paths
  if (
    s.startsWith('data:image/') ||
    s.startsWith('blob:') ||
    s.startsWith('http://') ||
    s.startsWith('https://') ||
    s.startsWith('/') ||
    s.startsWith('./') ||
    s.startsWith('../')
  ) {
    return true;
  }

  // Accept valid image extensions
  return /\.(jpg|jpeg|png|webp|svg|gif|avif|bmp|ico)(\?.*)?$/i.test(s);
}
