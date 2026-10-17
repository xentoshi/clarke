// CelesTrak GP element sets fetched 2026-10-17.
// The Space-Track ingest query used mean motion 0.99 to 1.01, so these three
// disposal-orbit objects were never stored and occupancy fell back to the
// 2023 UCS longitude. Merged only when spacetrack_tles has no row for the
// NORAD id. A later Space-Track ingest (query now 0.98 to 1.02) replaces them.
// Space-Track itself was not re-queried (no login on this run). CelesTrak
// carries the same catalog and is not an independent confirmation of it.

export interface DriftTleSupplement {
  noradId: string;
  name: string;
  epoch: string;
  ingestedAt: string;
  tle1: string;
  tle2: string;
  source: "celestrak";
  fetchedOn: "2026-10-17";
}

export const DRIFT_TLE_SUPPLEMENT: DriftTleSupplement[] = [
  {
    noradId: "23553",
    name: "AMSC 1",
    epoch: "2026-10-15",
    ingestedAt: "2026-10-17",
    tle1: "1 23553U 95019A   26288.73730839  .00000042  00000+0  00000+0 0  9992",
    tle2: "2 23553  13.4441  15.6326 0016949 305.3176  40.4606  0.98906637115278",
    source: "celestrak",
    fetchedOn: "2026-10-17",
  },
  {
    noradId: "26608",
    name: "INTELSAT 1R (IS-1R)",
    epoch: "2026-10-16",
    ingestedAt: "2026-10-17",
    tle1: "1 26608U 00072A   26289.78289170 -.00000206  00000+0  00000+0 0  9997",
    tle2: "2 26608   8.3728  63.3640 0005396 237.9388 319.2329  0.98969532 42430",
    source: "celestrak",
    fetchedOn: "2026-10-17",
  },
  {
    noradId: "20776",
    name: "SKYNET 4C",
    epoch: "2026-10-17",
    ingestedAt: "2026-10-17",
    tle1: "1 20776U 90079A   26290.00154963 -.00000226  00000+0  00000+0 0  9993",
    tle2: "2 20776  13.3000 349.0414 0002434 185.1093 190.6959  0.98580336  1244",
    source: "celestrak",
    fetchedOn: "2026-10-17",
  },
];
