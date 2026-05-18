export function lonToSlug(lon: number): string {
  const rounded = Math.round(Math.abs(lon) * 10) / 10;
  const dir = lon >= 0 ? "e" : "w";
  const str = rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1).replace(".", "-");
  return `${str}${dir}`;
}

export function slugToLon(slug: string): number | null {
  const match = slug.match(/^(\d+)(?:-(\d))?([ew])$/i);
  if (!match) return null;
  const int = parseInt(match[1]);
  const dec = match[2] ? parseInt(match[2]) : 0;
  const abs = int + dec / 10;
  return match[3].toLowerCase() === "w" ? -abs : abs;
}

export function formatLon(lon: number): string {
  if (lon >= 0) return `${lon}°E`;
  return `${Math.abs(lon)}°W`;
}
