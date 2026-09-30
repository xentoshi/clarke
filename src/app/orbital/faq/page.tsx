import Link from "next/link";
import { buildMeta } from "@/lib/metadata";
import { slots as curatedSlots } from "@/data/orbital-slots";
import { getSatelliteStats, mergeWithUcs } from "@/lib/satellites";
import FaqList from "./FaqList";

export const metadata = buildMeta({
  title: "Orbital Registry — FAQ",
  description:
    "How Clarke sources orbital data, what congestion scores mean, and why some positions lack FCC records.",
  tag: "FAQ",
});

function faqItems(geoCount: number, registryRows: number) {
  return [
  {
    q: "Where does this data come from?",
    a: "Satellite names, operators, and UCS catalog longitudes come from the UCS Satellite Database. Occupancy clustering (who is counted at a slot) uses a Space-Track TLE sub-satellite longitude when that TLE passes published age and quality gates, otherwise the UCS longitude. FCC authorization records come from the FCC Approved Space Station List. TLE longitude is not an FCC assignment or ITU filing. Congestion scores use TLE-primary occupancy, not ITU filing records.",
  },
  {
    q: "Why do some positions have FCC authorization data and others don't?",
    a: "FCC authorization records exist only for operators that hold a US license or have been granted US market access by the FCC. A position operated by a Russian, Chinese, or European operator under their own national administration will have no FCC record, and that absence reflects jurisdiction rather than a data gap in Clarke. Positions operated by US-headquartered companies or operators serving US markets will typically appear in FCC records regardless of where the satellite is physically located over the equator.",
  },
  {
    q: "What does it mean when multiple satellites appear at the same position?",
    a: "Multiple satellites can share the same nominal orbital longitude through ITU coordination agreements, each operating on different frequency assignments that prevent mutual interference. Clarke groups satellites within 0.4 degrees of a position using occupancy longitude (TLE-primary). SES-1 stays at 101°W because UCS and TLE agree; a satellite whose UCS row is stale (MUOS-2 still listed at 100.1°W) occupies at its TLE longitude instead. That TLE longitude is not an FCC or ITU assignment.",
  },
  {
    q: "How many total orbital positions exist versus what Clarke currently tracks?",
    a: `The ITU has registered approximately 1,800 GEO coordination filings across all member states, representing every position that has been filed, coordinated, or historically registered since the space age began. Clarke's registry table currently lists ${registryRows.toLocaleString()} rows, one per slug, built from ${geoCount.toLocaleString()} GEO satellites in the UCS snapshot plus FCC-only rows where a license has no nearby occupancy. Satellites that share an occupancy longitude rounded to 0.1° are one row. A satellite inside a curated slot's 0.4° window is occupancy on that curated row, not a second table row. ITU SNS is not ingested, so Clarke does not record those filings. The gap between filed networks and occupied rows includes squatted slots, historically registered positions no longer in use, and filings whose satellite never launched.`,
  },
  {
    q: "What is Ku-band versus Ka-band?",
    a: "Ku-band (11.7 to 12.7 GHz) is the primary direct-to-home broadcasting band, used by Sky, DirecTV, and most consumer satellite television. Consumer dishes are small and the infrastructure is widely deployed globally. Ka-band (26.5 to 40 GHz) delivers gigabit-class throughput per satellite and is increasingly used for broadband internet, though it is more susceptible to signal degradation from heavy rain. C-band (3.7 to 4.2 GHz) is legacy cable television distribution infrastructure, requiring larger dishes but offering exceptional reliability in all weather conditions.",
  },
  {
    q: "What does 'squatted' mean?",
    a: "Clarke's status label is On station, unlicensed. It is a curated registry label, not an ITU SNS record. ITU SNS is not ingested, so the label is not a network name, not brought-into-use evidence, and not a filled filing row. In the industry, squatting means a filing with no operational satellite on station. Clarke does not store that filing.",
  },
  {
    q: "What does the congestion number mean?",
    a: "Congestion v0 is a labeled model on the Slot Terminal, not a recorded fact. It is a normalized 0 to 100 index on TLE-primary occupancy (UCS catalog longitude only as fallback). It blends three signals at a position: how many GEO satellites occupy the surrounding arc (within 2 degrees on either side), how many sit directly co-located at the same nominal longitude (within 0.4 degrees), and how many distinct operators share the arc. A score near 0 means an empty stretch of orbit; a score near 100 means a dense, multi-operator arc where interference coordination requirements are highest. An arc dominated by a single operator scores lower than an equally packed arc contested by several operators, because shared arcs are harder to coordinate. The tiers are Sparse (0 to 14), Low (15 to 34), Moderate (35 to 54), High (55 to 74), and Critical (75 to 100).",
  },
  ];
}

export default function OrbitalFaqPage() {
  const geoCount = getSatelliteStats().geoCount;
  const registryRows = mergeWithUcs(curatedSlots).length;
  const faq = faqItems(geoCount, registryRows);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-muted text-sm mb-2">Registry FAQ</p>
          <h1 className="text-3xl font-semibold text-ink tracking-tight mb-2">Frequently asked questions</h1>
          <p className="text-muted text-base leading-relaxed">
            Data sources, congestion scores, and how position status is determined.
          </p>
        </div>
        <Link
          href="/orbital"
          className="text-muted text-sm hover:text-ink transition-colors shrink-0 mt-1"
        >
          ← Back to registry
        </Link>
      </div>

      <FaqList items={faq} />
    </div>
  );
}
