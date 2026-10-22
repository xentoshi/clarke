import type { ReactNode } from "react";
import type { TocItem } from "@/components/TableOfContents";

export const toc: TocItem[] = [
  { id: "how-we-checked", label: "How we checked" },
  { id: "the-two-core-cases", label: "The two core cases" },
  { id: "a-weaker-case", label: "A weaker case" },
  { id: "where-the-operator-did-update", label: "Where the operator did update" },
  { id: "from-244-flags-to-three-cases", label: "From 244 flags to three cases" },
  { id: "worked-example-the-laser-relays", label: "Worked example: the laser relays" },
  { id: "what-we-did-not-cover", label: "What we did not cover" },
  { id: "sources", label: "Sources" },
];

function A({ href, children }: { href: string; children: ReactNode }) {
  const external = /^https?:\/\//.test(href);
  return (
    <a
      href={href}
      className="text-ink underline underline-offset-[3px]"
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  );
}

function Th({ children }: { children: ReactNode }) {
  return (
    <th className="text-left text-faint text-xs font-medium px-3 py-2 border border-line bg-canvas align-bottom">
      {children}
    </th>
  );
}

function Td({ children }: { children: ReactNode }) {
  return (
    <td className="px-3 py-2 text-muted border border-line leading-relaxed align-top">{children}</td>
  );
}

export default function Post() {
  return (
    <div className="prose-clarke">
      <p>
        EDRS-C, the second satellite of Europe&apos;s laser data relay system, was{" "}
        <A href="https://www.esa.int/Newsroom/Press_Releases/EDRS-C_successfully_launched">launched in August 2019</A> to work at 31°E. Two ESA pages now disagree about where it is. ESA&apos;s space weather service, which runs a radiation monitor on the satellite, says EDRS-C was{" "}
        <A href="https://swe.ssa.esa.int/ngrm">moved on May 12, 2025 and has been at 142.5°E since June 15, 2025</A>. ESA&apos;s{" "}
        <A href="https://resilience.esa.int/archives/partnership-projects/european-data-relay-system-edrs">Connectivity and Secure Communications page on EDRS</A> says &quot;EDRS currently consists of two main nodes in geostationary orbit,&quot; with EDRS-C &quot;operating at 31° East.&quot; Its page source dates it: first published in November 2025 and modified on January 7, 2026, months after the move. (The &quot;archives&quot; in its address is part of the site&apos;s address structure, not a sign of an archived copy.)
      </p>
      <p>
        NOAA&apos;s{" "}
        <A href="https://www.ospo.noaa.gov/operations/goes/status.html">GOES status page</A>, stamped &quot;Last Updated: September 3, 2026,&quot; lists GOES-17 at &quot;104.4 West,&quot; with the note &quot;GOES-17 will be moved to 89.5W after GOES-16 relieves its position at 104.7W in July 2025.&quot; A{" "}
        <A href="https://www.weather.gov/emwin/emwin_notices">NOAA notice from June 2026</A> says GOES-17 is at 89.5°W.
      </p>
      <p>
        In both cases a page that presents itself as current lists a position the satellite has left. In one more case, INSAT-3D, the page is weaker evidence because it does not claim to be current.
      </p>
      <p>
        <A href="https://www.clarkebelt.finance/">Clarke</A> is a free public registry of who sits at each geostationary longitude, built from public tracking data, the FCC&apos;s Approved Space Station List and the Union of Concerned Scientists (UCS) satellite database, whose data is{" "}
        <A href="https://www.ucs.org/resources/satellite-database">current through May 1, 2023</A>. UCS{" "}
        <A href="https://blog.ucs.org/lgrego/our-satellite-database-reaches-a-milestone-weve-learned-much-along-the-way/">released that version in January 2024</A> and has paused updates since. Clarke flags satellites where the catalog and the tracking data disagree, and we went through those flags.
      </p>
      <p>
        <strong>Data as of October 22, 2026 (HKT).</strong> Latest TLE epochs October 20 and 21, 2026. Earlier epochs, May to October 2026, come from the{" "}
        <A href="https://github.com/xentoshi/clarke/commits/main/data/clarke.db">history of Clarke&apos;s public database</A>. Tracking data is from USSPACECOM, via{" "}
        <A href="https://www.space-track.org/">Space-Track.org</A> and{" "}
        <A href={"https://celestrak.org/NORAD/elements/gp.php?GROUP=geo&FORMAT=tle"}>CelesTrak</A>. The Clarke links return live values;{" "}
        <A href="/data/geo-relocations-2026-10-22/README.md">snapshots of each response</A>, fetched October 22, 2026 at 20:55 HKT, are published with the CSV. We read every official page quoted here on October 22, 2026 (HKT) and quote them as they read that day.
      </p>

      <h2 id="how-we-checked">How we checked</h2>
      <p>A satellite made the list only if it passed three tests.</p>
      <ol className="list-decimal pl-6 mb-8 space-y-4">
        <li>
          <p>
            <strong>The new position is stable.</strong> No stored TLE epoch, or the current CelesTrak set, is more than 0.5° from the latest position, no epoch shows drift faster than 0.1° a day, and the orbit is within 300 km of geostationary height. Readers who want a stricter rule can use the range column in our CSV (linked below). Four satellites pass our rule with a range over 0.5°: FY-4A (0.65°), UFO-10 (0.63°), Inmarsat 3 F5 (0.53°) and Express-103 (0.51°).
          </p>
        </li>
        <li>
          <p>
            <strong>Someone other than the tracking data confirms the move.</strong> That means an operator or agency statement, a regulatory filing, a WMO record or a sale announcement.
          </p>
        </li>
        <li>
          <p>
            <strong>An official page still lists the old position.</strong> We recorded the wording, the date we read it, and whether the page presents itself as current.
          </p>
        </li>
      </ol>
      <p>
        We kept only moves made after the UCS data&apos;s May 1, 2023 cutoff, and kept catalog rows that were wrong from the start separate.
      </p>
      <p>
        <strong>What each move rests on.</strong> Our tracking is one source: the US Space Force catalog, which CelesTrak redistributes, so CelesTrak is not a second opinion. Russia&apos;s independent{" "}
        <A href="https://www.unoosa.org/documents/pdf/copuos/stsc/2017/tech-05E.pdf">ISON network</A>, run by the Keldysh Institute of Applied Mathematics, publishes no orbit download we could find. We could not get filed positions from the ITU&apos;s Space Explorer database without a browser session. For context only: NSMC, China&apos;s meteorological satellite center, says coordination requests for Fengyun networks at seven longitudes,{" "}
        <A href="https://www.nsmc.org.cn/nsmc/en/operation/frequency.html">including FYGEOSAT-123.5E</A>, were submitted to the ITU in 2011. We found no free public statement from a commercial tracker about any of these satellites. Apart from tracking:
      </p>

      <div className="overflow-x-auto my-6">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <Th>Satellite</Th>
              <Th>Confirms the new position</Th>
              <Th>Lists the old position</Th>
              <Th>Does that page claim to be current?</Th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <Td>EDRS-C</Td>
              <Td>ESA space weather service; WMO</Td>
              <Td>ESA Connectivity page; ESA EDRS explainer</Td>
              <Td>Connectivity page: yes. Explainer: no date</Td>
            </tr>
            <tr>
              <Td>GOES-17</Td>
              <Td>NOAA notice (June 2026); WMO</Td>
              <Td>NOAA GOES status page</Td>
              <Td>Yes, dated September 3, 2026</Td>
            </tr>
            <tr>
              <Td>INSAT-3D</Td>
              <Td>WMO; ISRO report (old slot handed over)</Td>
              <Td>ISRO mission fact sheet</Td>
              <Td>No</Td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        Tracking for the seven satellites we checked in depth (stored epochs plus the current CelesTrak set; the history does not hold every satellite at every date):
      </p>

      <div className="overflow-x-auto my-6">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <Th>Satellite</Th>
              <Th>Stored epochs (2026)</Th>
              <Th>Longitude range</Th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <Td>EDRS-C</Td>
              <Td>Aug 24 to Oct 21</Td>
              <Td>142.48°E to 142.52°E</Td>
            </tr>
            <tr>
              <Td>GOES-17</Td>
              <Td>Jul 29 to Oct 21</Td>
              <Td>89.47°W to 89.50°W</Td>
            </tr>
            <tr>
              <Td>INSAT-3D</Td>
              <Td>Jul 29 to Oct 21</Td>
              <Td>129.49°E to 129.53°E</Td>
            </tr>
            <tr>
              <Td>GOES-16</Td>
              <Td>Jul 29 to Oct 21</Td>
              <Td>104.66°W to 104.73°W</Td>
            </tr>
            <tr>
              <Td>FY-4B</Td>
              <Td>May 21 to Oct 20</Td>
              <Td>104.60°E to 104.78°E</Td>
            </tr>
            <tr>
              <Td>FY-4A</Td>
              <Td>May 21 to Oct 21</Td>
              <Td>123.09°E to 123.74°E</Td>
            </tr>
            <tr>
              <Td>EWS-G2</Td>
              <Td>Aug 24 to Oct 21</Td>
              <Td>63.24°E to 63.43°E</Td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="the-two-core-cases">The two core cases</h2>
      <p>
        <strong>EDRS-C, ESA and Airbus.</strong> ESA&apos;s{" "}
        <A href="https://www.esa.int/Applications/Connectivity_and_Secure_Communications/EDRS/Laser_communications">EDRS explainer</A> also says &quot;EDRS-A is at 9°E and EDRS-C at 31°E.&quot; That page is undated, so we read it as a description, not a status report. WMO&apos;s satellite database{" "}
        <A href="https://space.oscar.wmo.int/satellites/view/edrs_c">lists 142.5°E</A>, and tracking agrees (<A href="https://www.clarkebelt.finance/api/v1/agents/slots/142-5e">live</A>). Its Ka-band payload, HYLAS 3, is the one{" "}
        <A href="https://www.skyperfectjsat.space/en/news/20260610">SKY Perfect JSAT agreed in June 2026 to buy</A> and plans to run as JSAT-144D over East Asia. The Connectivity page also mentions EDRS-D, &quot;a future third node,&quot; being developed to extend coverage &quot;including over the Asia-Pacific region.&quot; We have not found out whether that plan relates to EDRS-C&apos;s move.
      </p>
      <p>
        <strong>GOES-17, NOAA.</strong> GOES-17 was GOES-West at 137°W until{" "}
        <A href="https://space.oscar.wmo.int/satellites/view/goes_17">January 4, 2023</A>, then went into storage near 104°W, so the catalog&apos;s 137°W was already out of date when the catalog closed. The move that passes our date filter is the later one, from 104.4°W to 89.5°W. NOAA&apos;s status page planned it for July 2025. We found no NOAA notice confirming the dates. NOAA&apos;s{" "}
        <A href="https://www.weather.gov/emwin/emwin_notices">June 2026 notice</A>,{" "}
        <A href="https://space.oscar.wmo.int/satellites/view/goes_17">WMO</A> and tracking (<A href="https://www.clarkebelt.finance/api/v1/agents/slots/89-5w">live</A>) all put it at 89.5°W. The page has one &quot;Last Updated&quot; stamp, in its footer, and it is not automatic: the{" "}
        <A href="https://web.archive.org/web/20260728054423/https://www.ospo.noaa.gov/operations/goes/status.html">archived copy from July 28, 2026</A> reads &quot;July 23, 2026.&quot; Between the two versions several of GOES-17&apos;s instrument status entries changed, but not its location or note. The page says it is &quot;generally updated on a monthly basis.&quot;
      </p>

      <h2 id="a-weaker-case">A weaker case</h2>
      <p>
        <strong>INSAT-3D, ISRO.</strong> ISRO&apos;s{" "}
        <A href="https://www.isro.gov.in/INSAT_3D.html">INSAT-3D page</A> lists &quot;Orbit Geostationary, 82 deg E Longitude.&quot; It is a mission fact sheet, not a status page. ISRO told the Coordination Group for Meteorological Satellites that INSAT-3D{" "}
        <A href={"https://www.cgms-info.org/Agendas/GetWpFile.ashx?aid=ae1f15dd-3581-479d-b266-022cfa63cbf2&wid=4e49f0c9-6884-432e-994c-ded3bf8f2f48"}>&quot;is switched off since Jun 2024, replaced by INSAT-3DS at 82E.&quot;</A> WMO lists it at{" "}
        <A href="https://space.oscar.wmo.int/satellites/view/insat_3d">129.5°E with the status &quot;Back-up&quot;</A>, and its notes say the sounder &quot;failed in Sept 2020&quot; and give an end of life of October 1, 2024. WMO&apos;s instrument table marks the imager and the data collection and search-and-rescue payloads inactive from that date, flagged as estimated. So the instruments may be off while the spacecraft is parked as a back-up. Tracking holds it within a 0.04° range (<A href="https://www.clarkebelt.finance/api/v1/agents/slots/129-5e">live</A>). By our own estimate, an uncontrolled satellite there would drift several degrees over the 12 weeks our epochs cover, so it appears to be held in place. ISRO does not say whether &quot;switched off&quot; means the instruments or the whole spacecraft.
      </p>

      <h2 id="where-the-operator-did-update">Where the operator did update</h2>
      <p>
        <strong>GOES-16, NOAA.</strong> GOES-19{" "}
        <A href="https://space.oscar.wmo.int/satellites/view/goes_19">replaced GOES-16 as GOES-East at 75.2°W in April 2025</A>, and GOES-16 moved to storage. NOAA&apos;s{" "}
        <A href="https://www.ospo.noaa.gov/operations/goes/status.html">status page</A> lists it at &quot;104.7 West (location as of June 2025),&quot; and WMO lists{" "}
        <A href="https://space.oscar.wmo.int/satellites/view/goes_16">104.7°W</A>, as does tracking (<A href="https://www.clarkebelt.finance/api/v1/agents/slots/104-7w">live</A>). The page that lists GOES-17 at its old slot is current for GOES-16.
      </p>
      <p>
        <strong>FY-4B, China Meteorological Administration.</strong> NSMC&apos;s{" "}
        <A href="https://www.nsmc.org.cn/nsmc/en/operation/status.html">status page</A> records FY-4B&apos;s move from 133°E to 105°E in early 2024, and WMO{" "}
        <A href="https://space.oscar.wmo.int/satellites/view/fy_4b">agrees</A>, as does tracking (<A href="https://www.clarkebelt.finance/api/v1/agents/slots/105e">live</A>).
      </p>
      <p>
        <strong>FY-4A, China Meteorological Administration.</strong> The same status page gives FY-4A&apos;s history: 104.7°E until March 2024, 86.5°E from May 2024 to January 2025, and 123.5°E after February 18, 2025. WMO{" "}
        <A href="https://space.oscar.wmo.int/satellites/view/fy_4a">agrees</A>, and so does NSMC&apos;s{" "}
        <A href="https://www.nsmc.org.cn/nsmc/en/satellite/FY4A.html">FY-4A satellite page</A> (also served at a{" "}
        <A href="https://sac347.nsmc.org.cn/nsmc/en/satellite/FY4A.html">mirror</A> with the same text).¹ Tracking puts it near 123.5°E (<A href="https://www.clarkebelt.finance/api/v1/agents/slots/123-5e">live</A>). Its operating status is contested: the same NSMC page gives an end of service of 2024-03-05, an{" "}
        <A href="https://gsicsweb.eumetsat.int/wp-content/uploads/2025/03/1b-Welcome-address-and-GSICS-Introduction-YANG-Jun-new.pdf">NSMC presentation from March 2025</A> says it is &quot;now relocated at 123.5°E, non operational,&quot; and WMO lists it as &quot;Operational.&quot; Our own inference about its 0.65° range: in date order the epochs read 123.74°E, 123.63°E, 123.14°E, 123.09°E and 123.39°E, so the longitude reversed direction, and every one is within 0.41° of 123.5°E. That is consistent with station keeping within ±0.5°, the tolerance the Radio Regulations set for satellites that use no fixed- or broadcasting-satellite band, though a non-operational satellite may simply be controlled less tightly. We did not check which bands FY-4A&apos;s filing uses.
      </p>
      <p>
        ¹ A second NSMC page under /subject/{" "}
        <A href="https://nsmc.org.cn/subject/en/satellite/FY4A.html">still stops at 86.5°E</A>: &quot;104.7°E (before 2024-03-05), 86.5°E (after 2024-05-01).&quot;
      </p>

      <h2 id="from-244-flags-to-three-cases">From 244 flags to three cases</h2>
      <p>
        Clarke flagged 244 satellites where the catalog and the tracking data disagree. 77 were above or below the geostationary belt, and 59 were drifting or still moving between our epochs. That left 108 with a steady position.
      </p>
      <p>
        We labelled 11 of those 108 as likely catalog problems by simple rules, without checking each. Two look like sign flips: the catalog has the tracked longitude with the opposite east/west sign. For one of them, ABS-2A, the operator{" "}
        <A href="https://absatellite.com/satellite-fleet/abs-2a-75e/">places it at 75°E</A> and the catalog at 75°W. Eight form four pairs whose catalog longitudes look swapped, either positions or catalog numbers mixed up. One, WGS-8, looks like a sign flip, but the catalog&apos;s WGS-9 row is close to WGS-8&apos;s tracked position, so we cannot tell which row is wrong. These labels are heuristics, not verified errors: the sign-flip rule also caught Intelsat 28 (NORAD 37392, listed in the catalog as Intelsat New Dawn), which is likely a real move. An observer{" "}
        <A href="https://www.satobs.org/seesat/Dec-2024/0019.html">reported in December 2024</A> that it was to be moved from 33°E to 32°W, and tracking puts it at 31.7°W. We have not confirmed that move, so it stays in the unchecked pool. That leaves 97 plausible moves.
      </p>
      <p>
        We checked seven of the 97 in depth, chosen by hand: EDRS-C, from our laser-relay work, and all six weather satellites among the stable flags, because WMO&apos;s database made the second test quick. Three are listed above. Three (GOES-16, FY-4B, FY-4A) moved and the operator&apos;s status page shows it. One, EWS-G2 (formerly GOES-15), was left out because WMO lists it at 61.5°E while tracking puts it at 63.2°E to 63.4°E. The other 90, including Intelsat 28, are unchecked. Seven hand-picked cases do not give a rate for the rest.
      </p>
      <p>
        The list leans toward weather satellites because WMO&apos;s database covers them and records moves with dates. Commercial operators rarely publish dated position histories, so their moves may be harder to confirm rather than rarer.
      </p>
      <p>
        The classification of all 244 flags, plus STPSat-6, whose catalog row named the launch vehicle as its operator, is in a{" "}
        <A href="/data/geo-relocations-classification-2026-10-22.csv">CSV</A> with epochs, longitude ranges and reasons.
      </p>

      <h2 id="worked-example-the-laser-relays">Worked example: the laser relays</h2>
      <p>
        EDRS-C turned up while we were listing geostationary laser relays. We counted a satellite if it is stationed in the geostationary belt today, carries a terminal built to receive data from another spacecraft and pass it on, and has that terminal publicly documented by its operator or a space agency. There are five. Our{" "}
        <A href="/blog/geo-laser-relays">post on the laser relays</A> has the sources for each row.
      </p>

      <div className="overflow-x-auto my-6">
        <table className="w-full text-xs border-collapse min-w-[64rem]">
          <thead>
            <tr>
              <Th>Relay</Th>
              <Th>Host satellite</Th>
              <Th>Status</Th>
              <Th>Published longitude (source)</Th>
              <Th>Clarke TLE longitude</Th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <Td>NASA LCRD</Td>
              <Td>STPSat-6</Td>
              <Td>
                <A href="https://ntrs.nasa.gov/citations/20250011578">Experiment, extended phase since June 2024</A>
              </Td>
              <Td>
                <A href="https://ntrs.nasa.gov/citations/20240011025">112°W</A> (NASA)
              </Td>
              <Td>
                <A href="https://www.clarkebelt.finance/api/v1/agents/slots/111-9w">111.86°W</A>
              </Td>
            </tr>
            <tr>
              <Td>EDRS-A</Td>
              <Td>Eutelsat 9B</Td>
              <Td>
                <A href="https://www.airbus.com/en/products-services/defence/military-space/space-data-highway">Operational service</A>
              </Td>
              <Td>
                <A href="https://www.esa.int/Applications/Connectivity_and_Secure_Communications/EDRS/Laser_communications">9°E</A> (ESA)
              </Td>
              <Td>
                <A href="https://www.clarkebelt.finance/api/v1/agents/slots/9e">8.95°E</A>
              </Td>
            </tr>
            <tr>
              <Td>EDRS-C</Td>
              <Td>EDRS-C / HYLAS 3</Td>
              <Td>
                <A href="https://swe.ssa.esa.int/ngrm">Relocated</A>; relay service unknown
              </Td>
              <Td>
                <A href="https://www.esa.int/Applications/Connectivity_and_Secure_Communications/EDRS/Laser_communications">31°E</A> (ESA explainer);{" "}
                <A href="https://swe.ssa.esa.int/ngrm">142.5°E</A> (ESA space weather);{" "}
                <A href="https://space.oscar.wmo.int/satellites/view/edrs_c">142.5°E</A> (WMO)
              </Td>
              <Td>
                <A href="https://www.clarkebelt.finance/api/v1/agents/slots/142-5e">142.52°E</A>
              </Td>
            </tr>
            <tr>
              <Td>Alphasat laser terminal</Td>
              <Td>Inmarsat 4A-F4</Td>
              <Td>
                <A href="https://www.esa.int/Applications/Connectivity_and_Secure_Communications/World-first_gigabit-per-second_laser_link_between_aircraft_and_geostationary_satellite">Demonstration, in use in 2025</A>
              </Td>
              <Td>
                <A href="https://www.esa.int/Applications/Connectivity_and_Secure_Communications/Alphasat/Overview">25°E</A> (ESA)
              </Td>
              <Td>
                <A href="https://www.clarkebelt.finance/api/v1/agents/slots/25e">24.86°E</A>
              </Td>
            </tr>
            <tr>
              <Td>JAXA LUCAS</Td>
              <Td>JDRS-1</Td>
              <Td>
                <A href="https://global.jaxa.jp/press/2025/01/20250123-1_e.html">Operational</A>
              </Td>
              <Td>
                <A href="https://www.mext.go.jp/b_menu/shingi/gijyutu/gijyutu2/059/shiryo/__icsFiles/afieldfile/2017/10/27/1397652_4.pdf">90.75°E</A> (JAXA, planned slot)
              </Td>
              <Td>
                <A href="https://www.clarkebelt.finance/api/v1/agents/slots/91e">90.75°E</A>
              </Td>
            </tr>
          </tbody>
        </table>
      </div>

      <ol className="list-decimal pl-6 mb-8 space-y-4">
        <li>
          <p>
            <strong>EDRS-C.</strong> EDRS&apos;s ground stations are in Belgium, the UK, Germany and Italy,{" "}
            <A href="https://www.esa.int/Applications/Connectivity_and_Secure_Communications/EDRS/Overview">according to ESA</A>. Our own inference from geometry, not a published statement: a geostationary satellite sees about 81 degrees of longitude either side of its position, and those stations are more than 120 degrees west of 142.5°E, so they should be below its horizon. We found no Airbus or ESA statement on what relay service, if any, EDRS-C now provides.
          </p>
        </li>
        <li>
          <p>
            <strong>STPSat-6.</strong> The satellite is where NASA says it is. Its catalog row had the launch vehicle in the operator field, so until October 22, 2026 Clarke showed no operator for its slot. We fixed the parsing that day, and the slot now shows US Space Force / DoD Space Test Program.
          </p>
        </li>
        <li>
          <p>
            <strong>Small gaps.</strong> The ±0.1° tolerance in an{" "}
            <A href="https://www.itu.int/dms_pubrec/itu-r/rec/s/R-REC-S.484-3-199203-I!!PDF-E.pdf">ITU recommendation</A> and{" "}
            <A href="https://www.itu.int/pub/R-REG-RR">Article 22 of the Radio Regulations</A> applies to satellites using fixed-satellite or broadcasting-satellite bands. Others, and experimental stations, have ±0.5°. Alphasat is a mobile-service satellite with an{" "}
            <A href="https://www.esa.int/Applications/Connectivity_and_Secure_Communications/Alphasat/Overview">Inmarsat L-band payload</A>; we did not establish which tolerance its filing falls under. LCRD and Alphasat both differ from their published longitude by 0.14°. Published longitudes are often rounded and a TLE gives the position at one moment, so we treat gaps of this size as noise. EDRS-C is 111 degrees away.
          </p>
        </li>
      </ol>

      <h2 id="what-we-did-not-cover">What we did not cover</h2>
      <p>
        The 90 unchecked flags may include real moves. Our tracking history starts in May 2026, so it shows where each satellite is now, not when it moved. Move dates come from operators, ESA and WMO.
      </p>

      <h2 id="sources">Sources</h2>
      <ol className="text-faint text-xs space-y-1 font-mono">
        <li><A href="https://www.esa.int/Newsroom/Press_Releases/EDRS-C_successfully_launched">launched in August 2019</A></li>
        <li><A href="https://swe.ssa.esa.int/ngrm">moved on May 12, 2025 and has been at 142.5°E since June 15, 2025</A></li>
        <li><A href="https://resilience.esa.int/archives/partnership-projects/european-data-relay-system-edrs">Connectivity and Secure Communications page on EDRS</A></li>
        <li><A href="https://www.ospo.noaa.gov/operations/goes/status.html">GOES status page</A></li>
        <li><A href="https://www.weather.gov/emwin/emwin_notices">NOAA notice from June 2026</A></li>
        <li><A href="https://www.clarkebelt.finance/">Clarke</A></li>
        <li><A href="https://www.ucs.org/resources/satellite-database">current through May 1, 2023</A></li>
        <li><A href="https://blog.ucs.org/lgrego/our-satellite-database-reaches-a-milestone-weve-learned-much-along-the-way/">released that version in January 2024</A></li>
        <li><A href="https://github.com/xentoshi/clarke/commits/main/data/clarke.db">history of Clarke&apos;s public database</A></li>
        <li><A href="https://www.space-track.org/">Space-Track.org</A></li>
        <li><A href={"https://celestrak.org/NORAD/elements/gp.php?GROUP=geo&FORMAT=tle"}>CelesTrak</A></li>
        <li><A href="/data/geo-relocations-2026-10-22/README.md">snapshots of each response</A></li>
        <li><A href="https://www.unoosa.org/documents/pdf/copuos/stsc/2017/tech-05E.pdf">ISON network</A></li>
        <li><A href="https://www.nsmc.org.cn/nsmc/en/operation/frequency.html">including FYGEOSAT-123.5E</A></li>
        <li><A href="https://www.esa.int/Applications/Connectivity_and_Secure_Communications/EDRS/Laser_communications">EDRS explainer</A></li>
        <li><A href="https://space.oscar.wmo.int/satellites/view/edrs_c">lists 142.5°E</A></li>
        <li><A href="https://www.clarkebelt.finance/api/v1/agents/slots/142-5e">142.52°E</A></li>
        <li><A href="https://www.skyperfectjsat.space/en/news/20260610">SKY Perfect JSAT agreed in June 2026 to buy</A></li>
        <li><A href="https://space.oscar.wmo.int/satellites/view/goes_17">January 4, 2023</A></li>
        <li><A href="https://www.clarkebelt.finance/api/v1/agents/slots/89-5w">89.5°W</A></li>
        <li><A href="https://web.archive.org/web/20260728054423/https://www.ospo.noaa.gov/operations/goes/status.html">archived copy from July 28, 2026</A></li>
        <li><A href="https://www.isro.gov.in/INSAT_3D.html">INSAT-3D page</A></li>
        <li><A href={"https://www.cgms-info.org/Agendas/GetWpFile.ashx?aid=ae1f15dd-3581-479d-b266-022cfa63cbf2&wid=4e49f0c9-6884-432e-994c-ded3bf8f2f48"}>&quot;is switched off since Jun 2024, replaced by INSAT-3DS at 82E.&quot;</A></li>
        <li><A href="https://space.oscar.wmo.int/satellites/view/insat_3d">129.5°E with the status &quot;Back-up&quot;</A></li>
        <li><A href="https://www.clarkebelt.finance/api/v1/agents/slots/129-5e">129.5°E</A></li>
        <li><A href="https://space.oscar.wmo.int/satellites/view/goes_19">replaced GOES-16 as GOES-East at 75.2°W in April 2025</A></li>
        <li><A href="https://space.oscar.wmo.int/satellites/view/goes_16">104.7°W</A></li>
        <li><A href="https://www.clarkebelt.finance/api/v1/agents/slots/104-7w">104.7°W</A></li>
        <li><A href="https://www.nsmc.org.cn/nsmc/en/operation/status.html">NSMC status page</A></li>
        <li><A href="https://space.oscar.wmo.int/satellites/view/fy_4b">FY-4B</A></li>
        <li><A href="https://www.clarkebelt.finance/api/v1/agents/slots/105e">105°E</A></li>
        <li><A href="https://space.oscar.wmo.int/satellites/view/fy_4a">FY-4A</A></li>
        <li><A href="https://www.nsmc.org.cn/nsmc/en/satellite/FY4A.html">FY-4A satellite page</A></li>
        <li><A href="https://sac347.nsmc.org.cn/nsmc/en/satellite/FY4A.html">mirror</A></li>
        <li><A href="https://www.clarkebelt.finance/api/v1/agents/slots/123-5e">123.5°E</A></li>
        <li><A href="https://gsicsweb.eumetsat.int/wp-content/uploads/2025/03/1b-Welcome-address-and-GSICS-Introduction-YANG-Jun-new.pdf">NSMC presentation from March 2025</A></li>
        <li><A href="https://nsmc.org.cn/subject/en/satellite/FY4A.html">still stops at 86.5°E</A></li>
        <li><A href="https://absatellite.com/satellite-fleet/abs-2a-75e/">places it at 75°E</A></li>
        <li><A href="https://www.satobs.org/seesat/Dec-2024/0019.html">reported in December 2024</A></li>
        <li><A href="/data/geo-relocations-classification-2026-10-22.csv">CSV</A></li>
        <li><A href="/blog/geo-laser-relays">post on the laser relays</A></li>
        <li><A href="https://ntrs.nasa.gov/citations/20250011578">Experiment, extended phase since June 2024</A></li>
        <li><A href="https://ntrs.nasa.gov/citations/20240011025">112°W</A></li>
        <li><A href="https://www.clarkebelt.finance/api/v1/agents/slots/111-9w">111.86°W</A></li>
        <li><A href="https://www.airbus.com/en/products-services/defence/military-space/space-data-highway">Operational service</A></li>
        <li><A href="https://www.clarkebelt.finance/api/v1/agents/slots/9e">8.95°E</A></li>
        <li><A href="https://www.esa.int/Applications/Connectivity_and_Secure_Communications/World-first_gigabit-per-second_laser_link_between_aircraft_and_geostationary_satellite">Demonstration, in use in 2025</A></li>
        <li><A href="https://www.esa.int/Applications/Connectivity_and_Secure_Communications/Alphasat/Overview">25°E</A></li>
        <li><A href="https://www.clarkebelt.finance/api/v1/agents/slots/25e">24.86°E</A></li>
        <li><A href="https://global.jaxa.jp/press/2025/01/20250123-1_e.html">Operational</A></li>
        <li><A href="https://www.mext.go.jp/b_menu/shingi/gijyutu/gijyutu2/059/shiryo/__icsFiles/afieldfile/2017/10/27/1397652_4.pdf">90.75°E</A></li>
        <li><A href="https://www.clarkebelt.finance/api/v1/agents/slots/91e">90.75°E</A></li>
        <li><A href="https://www.esa.int/Applications/Connectivity_and_Secure_Communications/EDRS/Overview">according to ESA</A></li>
        <li><A href="https://www.itu.int/dms_pubrec/itu-r/rec/s/R-REC-S.484-3-199203-I!!PDF-E.pdf">ITU recommendation</A></li>
        <li><A href="https://www.itu.int/pub/R-REG-RR">Article 22 of the Radio Regulations</A></li>
      </ol>
    </div>
  );
}
