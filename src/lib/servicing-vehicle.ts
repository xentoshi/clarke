// A servicing vehicle that shares an element set with another payload is
// attached to that host. MEV-2 and Intelsat 10-02 are the worked example.
// Identical element sets are the evidence. A docking notice was not fetched.

export interface ServicingAttachment {
  role: "servicing";
  hostName: string;
  hostNoradId: string;
  basis: "identical_element_set";
}

export function isServicingVehicleName(name: string | null | undefined): boolean {
  return /\bMEV-\d+\b|\bMission Extension Vehicle\b/i.test(name ?? "");
}

/** Epoch plus line-2 elements, without catalog number or revolution count. */
export function elementSetKey(tle1: string, tle2: string): string | null {
  if (!tle1.startsWith("1 ") || tle2.length < 63 || !tle2.startsWith("2 ")) return null;
  const epoch = tle1.slice(18, 32).trim();
  const elements = tle2.slice(8, 63).replace(/\s+/g, " ").trim();
  if (!epoch || !elements) return null;
  return `${epoch}|${elements}`;
}

export function servicingByNorad(
  rows: { noradId: string | null; name: string; tle1: string | null; tle2: string | null }[],
): Map<string, ServicingAttachment> {
  const groups = new Map<string, { noradId: string | null; name: string }[]>();
  for (const row of rows) {
    if (!row.tle1 || !row.tle2) continue;
    const key = elementSetKey(row.tle1, row.tle2);
    if (!key) continue;
    const group = groups.get(key);
    if (group) group.push(row);
    else groups.set(key, [row]);
  }

  const attachments = new Map<string, ServicingAttachment>();
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const hosts = group.filter((row) => !isServicingVehicleName(row.name) && row.noradId);
    const servicers = group.filter((row) => isServicingVehicleName(row.name) && row.noradId);
    if (hosts.length === 0 || servicers.length === 0) continue;
    const host = [...hosts].sort((a, b) => a.name.localeCompare(b.name))[0];
    for (const servicer of servicers) {
      if (!servicer.noradId || !host.noradId) continue;
      attachments.set(servicer.noradId, {
        role: "servicing",
        hostName: host.name,
        hostNoradId: host.noradId,
        basis: "identical_element_set",
      });
    }
  }
  return attachments;
}
