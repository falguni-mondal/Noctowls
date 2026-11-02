/**
 * Appends ImageKit real-time URL transformation parameters (`?tr=...`)
 * so each component downloads the exact pixel dimensions and quality it needs.
 * Non-ImageKit URLs (local assets, blob: previews, data: URIs) are returned untouched.
 */
export const optimizeImage = (
  url,
  { width, height, quality = 80, format = "auto", crop } = {}
) => {
  if (!url || typeof url !== "string") return "";
  if (!url.includes("ik.imagekit.io")) return url;

  const transforms = [];
  if (width) transforms.push(`w-${Math.round(width)}`);
  if (height) transforms.push(`h-${Math.round(height)}`);
  if (crop) transforms.push(`c-${crop}`);
  if (quality) transforms.push(`q-${Math.round(quality)}`);
  if (format) transforms.push(`f-${format}`);

  if (transforms.length === 0) return url;

  const trString = transforms.join(",");

  try {
    const parsedUrl = new URL(url);
    parsedUrl.searchParams.set("tr", trString);
    return parsedUrl.toString();
  } catch {
    // Fallback if URL is relative or malformed
    const cleanUrl = url.replace(/([?&])tr=[^&]*(&|$)/, "$1").replace(/[?&]$/, "");
    const separator = cleanUrl.includes("?") ? "&" : "?";
    return `${cleanUrl}${separator}tr=${trString}`;
  }
};

/**
 * Generates a responsive `srcSet` string for ImageKit URLs across multiple breakpoints.
 */
export const getResponsiveSrcSet = (
  url,
  widths = [300, 500, 800],
  quality = 80
) => {
  if (!url || typeof url !== "string" || !url.includes("ik.imagekit.io")) {
    return undefined;
  }

  return widths
    .map((w) => `${optimizeImage(url, { width: w, quality })} ${w}w`)
    .join(", ");
};
