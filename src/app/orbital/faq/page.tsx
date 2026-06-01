import Link from "next/link";
import { buildMeta } from "@/lib/metadata";
import FaqList from "./FaqList";

export const metadata = buildMeta({
  title: "Orbital Registry — FAQ",
  description:
    "How Clarke sources orbital data, what congestion scores mean, how yield works, and why some positions lack FCC records.",
  tag: "FAQ",
});

const faq = [
  {
    q: "Where does this data come from?",
    a: "Satellite names, operators, and orbital positions come from the UCS Satellite Database, a normalized catalog of active satellites maintained by the Union of Concerned Scientists and updated twice yearly. FCC authorization records, including call signs, licensed frequency bands, and in-orbit dates, come from the FCC Approved Space Station List, the official government record of all space stations authorized to operate in or serve the United States. Congestion scores are computed from satellite density in the UCS data rather than from ITU filing records, meaning they reflect the density of active operational hardware rather than the broader universe of filed and coordinated positions.",
  },
  {
    q: "Why do some positions have FCC authorization data and others don't?",
    a: "FCC authorization records exist only for operators that hold a US license or have been granted US market access by the FCC. A position operated by a Russian, Chinese, or European operator under their own national administration will have no FCC record, and that absence reflects jurisdiction rather than a data gap in Clarke. Positions operated by US-headquartered companies or operators serving US markets will typically appear in FCC records regardless of where the satellite is physically located over the equator.",
  },
  {
    q: "What does it mean when multiple satellites appear at the same position?",
    a: "Multiple satellites can share the same nominal orbital longitude through ITU coordination agreements, each operating on different frequency assignments that prevent mutual interference. The 19.2°E position in the Clarke registry, for example, has four distinct SES Astra satellites operating within 0.14 degrees of each other under the same nominal position. Clarke groups satellites within 0.4 degrees of a position's nominal longitude as co-located, which is the standard tolerance used in ITU coordination practice.",
  },
  {
    q: "How many total orbital positions exist versus what Clarke currently tracks?",
    a: "The ITU has registered approximately 1,800 GEO coordination filings across all member states, representing every position that has been filed, coordinated, or historically registered since the space age began. Clarke currently tracks 590 active satellites from the UCS database across 407 distinct occupied positions. The difference between 1,800 total filings and 407 occupied positions reflects squatted slots with no operational satellite, historically registered positions no longer in active use, filed positions where the satellite has never launched, and coordination filings from operators who have since surrendered their rights.",
  },
  {
    q: "How is yield calculated?",
    a: "Satellite operators charge annual lease fees to use an orbital position. That revenue is distributed pro-rata to token holders each quarter based on the yield share percentage set when the offering is created.",
  },
  {
    q: "What is Ku-band versus Ka-band?",
    a: "Ku-band (11.7 to 12.7 GHz) is the primary direct-to-home broadcasting band, used by Sky, DirecTV, and most consumer satellite television. Consumer dishes are small and the infrastructure is widely deployed globally. Ka-band (26.5 to 40 GHz) delivers gigabit-class throughput per satellite and is increasingly used for broadband internet, though it is more susceptible to signal degradation from heavy rain. C-band (3.7 to 4.2 GHz) is legacy cable television distribution infrastructure, requiring larger dishes but offering exceptional reliability in all weather conditions.",
  },
  {
    q: "Who can tokenize a slot?",
    a: "Only the ITU filing holder, meaning the entity that holds the coordination agreement and national license for that orbital position, can list an offering on Clarke. Operators such as SES, Intelsat, and Eutelsat would list their slots directly. Investors purchase fractional tokens representing a claim on the transponder lease revenue the operator collects from that position.",
  },
  {
    q: "What does 'squatted' mean?",
    a: "A squatted slot has an ITU filing on record but no operational satellite currently using the position. The ITU found that 45% of investigated satellite networks showed no verifiable proof of being brought into use. Governments and operators file positions preemptively to block competitors from occupying strategically valuable arcs, to preserve optionality for future satellite programs, or to create tradeable coordination rights, a practice sometimes called paper satellites.",
  },
  {
    q: "What does the congestion number mean?",
    a: "The congestion score is a normalized 0 to 100 index that blends three signals at a position: how many active GEO satellites occupy the surrounding arc (within 2 degrees on either side), how many sit directly co-located at the same nominal longitude (within 0.4 degrees), and how many distinct operators share the arc. A score near 0 means an empty stretch of orbit; a score near 100 means a dense, multi-operator arc where interference coordination requirements are highest. An arc dominated by a single operator scores lower than an equally packed arc contested by several operators, because shared arcs are harder to coordinate. The tiers are Sparse (0 to 14), Low (15 to 34), Moderate (35 to 54), High (55 to 74), and Critical (75 to 100). The densest arc currently tracked is the European Ku-band corridor between 13°E and 28°E.",
  },
  {
    q: "Is this live on mainnet?",
    a: "Clarke is a proof of concept running on Solana devnet. Transactions are real on-chain interactions verifiable on Solana Explorer, but no real capital is involved and no operators are live. Mainnet deployment requires establishing the legal SPV structure with real satellite operators, which is the next phase of development.",
  },
];

export default function OrbitalFaqPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-zinc-600 text-xs font-mono mb-3">// ORBITAL_REGISTRY · FAQ</p>
          <h1 className="text-2xl font-bold text-white mb-2">Frequently asked questions</h1>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Data sources, congestion scores, yield mechanics, and how tokenization works.
          </p>
        </div>
        <Link
          href="/orbital"
          className="text-zinc-600 text-xs hover:text-zinc-300 transition-colors shrink-0 mt-1"
        >
          ← Back to registry
        </Link>
      </div>

      <FaqList items={faq} />
    </div>
  );
}
