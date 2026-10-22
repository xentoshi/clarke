import type { ReactNode } from "react";
import type { TocItem } from "@/components/TableOfContents";

export const toc: TocItem[] = [
  { id: "the-five-relays", label: "The five relays" },
  { id: "how-these-relays-came-about", label: "How these relays came about" },
  { id: "why-lasers-and-what-limits-them", label: "Why lasers, and what limits them" },
  { id: "deep-space-is-a-different-setup", label: "Deep space is a different setup" },
  { id: "planned-relays", label: "Planned relays" },
  { id: "sources", label: "Sources" },
];

function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="text-ink underline underline-offset-[3px]" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

function NoteRef({ id }: { id: "a" | "b" | "c" }) {
  return (
    <a href={`#note-${id}`} className="text-ink underline underline-offset-[3px]">
      ({id})
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
        EDRS-C, the second satellite of Europe&apos;s laser data relay system, was launched to work at 31°E. ESA&apos;s EDRS page{" "}
        <Ext href="https://www.esa.int/Applications/Connectivity_and_Secure_Communications/EDRS/Laser_communications">lists it at 31°E</Ext>.
        ESA&apos;s space weather service, which runs a radiation monitor on the satellite, says it was{" "}
        <Ext href="https://swe.ssa.esa.int/ngrm">moved on May 12, 2025 and has been at 142.5°E since June 15, 2025</Ext>.
        The World Meteorological Organization&apos;s satellite database{" "}
        <Ext href="https://space.oscar.wmo.int/satellites/view/edrs_c">also lists 142.5°E</Ext>, and public tracking data puts it at{" "}
        <Ext href="https://www.clarkebelt.finance/api/v1/agents/slots/142-5e">142.52°E</Ext>.
        We found this while listing the laser relays in the geostationary belt. There are five.
      </p>
      <p>
        <Ext href="https://www.clarkebelt.finance/">Clarke</Ext> is a free public registry of who sits at each geostationary longitude. It combines public tracking data, the FCC&apos;s Approved Space Station List and the Union of Concerned Scientists (UCS) satellite database, whose data is{" "}
        <Ext href="https://www.ucs.org/resources/satellite-database">current through May 1, 2023</Ext>, and flags the places where they disagree.
      </p>

      <h2 id="the-five-relays">The five relays</h2>
      <p>
        We counted a satellite if it is stationed in the geostationary (GEO) belt today, carries a laser terminal built to receive data from another spacecraft and pass it on, and the operator or a space agency has documented that terminal publicly.
      </p>
      <p>
        <strong>Data as of October 22, 2026 (HKT).</strong> TLE epochs October 21, 2026. FCC Approved Space Station List dated September 27, 2026. The Clarke links return live values, so they will drift from this table over time.
      </p>

      <div className="overflow-x-auto my-6">
        <table className="w-full text-xs border-collapse min-w-[72rem]">
          <thead>
            <tr>
              <Th>Relay</Th>
              <Th>Host satellite (NORAD number)</Th>
              <Th>Status</Th>
              <Th>Published longitude (source type)</Th>
              <Th>Clarke TLE longitude</Th>
              <Th>Clarke operator</Th>
              <Th>FCC rows</Th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <Td>NASA LCRD</Td>
              <Td>STPSat-6 (49817)</Td>
              <Td>
                <Ext href="https://ntrs.nasa.gov/citations/20250011578">Experiment, in extended phase since June 2024</Ext>
              </Td>
              <Td>
                <Ext href="https://ntrs.nasa.gov/citations/20240011025">112°W</Ext> (NASA paper)
              </Td>
              <Td>
                <Ext href="https://www.clarkebelt.finance/api/v1/agents/slots/111-9w">111.86°W</Ext>
              </Td>
              <Td>US Space Force / DoD STP <NoteRef id="b" /></Td>
              <Td>none <NoteRef id="c" /></Td>
            </tr>
            <tr>
              <Td>EDRS-A</Td>
              <Td>Eutelsat 9B (41310)</Td>
              <Td>
                <Ext href="https://www.airbus.com/en/products-services/defence/military-space/space-data-highway">Operational service</Ext>
              </Td>
              <Td>
                <Ext href="https://www.esa.int/Applications/Connectivity_and_Secure_Communications/EDRS/Laser_communications">9°E</Ext> (ESA)
              </Td>
              <Td>
                <Ext href="https://www.clarkebelt.finance/api/v1/agents/slots/9e">8.95°E</Ext>
              </Td>
              <Td>Eutelsat</Td>
              <Td>none <NoteRef id="c" /></Td>
            </tr>
            <tr>
              <Td>EDRS-C</Td>
              <Td>EDRS-C / HYLAS 3 (44475)</Td>
              <Td>
                <Ext href="https://space.oscar.wmo.int/satellites/view/edrs_c">Relocated</Ext>; relay service unknown <NoteRef id="a" />
              </Td>
              <Td>
                <Ext href="https://www.esa.int/Applications/Connectivity_and_Secure_Communications/EDRS/Laser_communications">31°E</Ext> (ESA);{" "}
                <Ext href="https://space.oscar.wmo.int/satellites/view/edrs_c">142.5°E</Ext> (WMO database)
              </Td>
              <Td>
                <Ext href="https://www.clarkebelt.finance/api/v1/agents/slots/142-5e">142.52°E</Ext>
              </Td>
              <Td>Airbus</Td>
              <Td>none <NoteRef id="c" /></Td>
            </tr>
            <tr>
              <Td>Alphasat laser terminal (TDP-1)</Td>
              <Td>Inmarsat 4A-F4 (39215)</Td>
              <Td>
                <Ext href="https://www.esa.int/Applications/Connectivity_and_Secure_Communications/World-first_gigabit-per-second_laser_link_between_aircraft_and_geostationary_satellite">Demonstration, still in use in 2025</Ext>
              </Td>
              <Td>
                <Ext href="https://www.esa.int/Applications/Connectivity_and_Secure_Communications/Alphasat/Overview">25°E</Ext> (ESA)
              </Td>
              <Td>
                <Ext href="https://www.clarkebelt.finance/api/v1/agents/slots/25e">24.86°E</Ext>
              </Td>
              <Td>Inmarsat / ESA</Td>
              <Td>none <NoteRef id="c" /></Td>
            </tr>
            <tr>
              <Td>JAXA LUCAS</Td>
              <Td>JDRS-1 (47202)</Td>
              <Td>
                <Ext href="https://global.jaxa.jp/press/2025/01/20250123-1_e.html">Operational</Ext>
              </Td>
              <Td>
                <Ext href="https://www.mext.go.jp/b_menu/shingi/gijyutu/gijyutu2/059/shiryo/__icsFiles/afieldfile/2017/10/27/1397652_4.pdf">90.75°E</Ext> (JAXA 2017: same slot as its predecessor DRTS);{" "}
                <Ext href="http://www.tbs-satellite.com/tse/online/sat_jdrs_1.html">90.7°E</Ext> (third-party database)
              </Td>
              <Td>
                <Ext href="https://www.clarkebelt.finance/api/v1/agents/slots/91e">90.75°E</Ext>
              </Td>
              <Td>JAXA</Td>
              <Td>none <NoteRef id="c" /></Td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        Clarke takes each position from a two-line element set (TLE), the public orbit data for a tracked object. A TLE longitude is a snapshot at one moment, not an assigned slot. Satellites also move inside a small box. The ±0.1° figure often quoted comes from an{" "}
        <Ext href="https://www.itu.int/dms_pubrec/itu-r/rec/s/R-REC-S.484-3-199203-I!!PDF-E.pdf">ITU recommendation</Ext> and{" "}
        <Ext href="https://www.itu.int/pub/R-REG-RR">Article 22 of the Radio Regulations</Ext>, and it applies to satellites using fixed-satellite or broadcasting-satellite bands. Satellites that use neither, and experimental stations, have ±0.5°. Alphasat is a mobile-service satellite:{" "}
        <Ext href="https://www.esa.int/Applications/Connectivity_and_Secure_Communications/Alphasat/Overview">ESA lists its main payload</Ext> as Inmarsat&apos;s L-band payload. We did not establish which tolerance its filing falls under. LCRD (112°W published, 111.86°W tracked) and Alphasat (25°E published, 24.86°E tracked) both differ by 0.14°. That is about the size of these boxes, published longitudes are often rounded, and a TLE gives the position at one moment, so we treat gaps of this size as noise. A gap of 111 degrees, as with EDRS-C, is not.
      </p>

      <p id="note-a">
        <strong>(a) EDRS-C has moved.</strong> ESA{" "}
        <Ext href="https://www.esa.int/Newsroom/Press_Releases/EDRS-C_successfully_launched">launched EDRS-C on August 6, 2019</Ext> to operate at 31°E. ESA&apos;s EDRS laser page is an undated explainer written in the present tense. A second ESA page, on its{" "}
        <Ext href="https://resilience.esa.int/archives/partnership-projects/european-data-relay-system-edrs">Connectivity and Secure Communications site</Ext>, says &quot;EDRS currently consists of two main nodes in geostationary orbit,&quot; with EDRS-C &quot;operating at 31° East,&quot; so that page does present itself as current. Its metadata gives a last-modified date of January 7, 2026. Clarke&apos;s{" "}
        <Ext href="https://www.clarkebelt.finance/api/v1/agents/slots/31e">31°E slot</Ext> now lists it as a &quot;ghost,&quot; meaning the old catalog puts it there but tracking finds it elsewhere. Its Ka-band payload is called HYLAS 3. In June 2026,{" "}
        <Ext href="https://www.skyperfectjsat.space/en/news/20260610">SKY Perfect JSAT agreed to buy HYLAS 3</Ext> from Avanti and expects to operate it as JSAT-144D, covering East Asia, from early fiscal year 2027. EDRS&apos;s ground stations are in Belgium, the UK, Germany and Italy,{" "}
        <Ext href="https://www.esa.int/Applications/Connectivity_and_Secure_Communications/EDRS/Overview">according to ESA</Ext>. Our own inference from geometry, not a published statement: a GEO satellite can see about 81 degrees of longitude either side of its position, and those stations are more than 120 degrees west of 142.5°E, so they should be below its horizon. We found no Airbus or ESA statement on what relay service, if any, EDRS-C now provides.
      </p>

      <p id="note-b">
        <strong>(b) STPSat-6 had a bad catalog row, which we fixed.</strong> The satellite is in the right place. The UCS catalog row for it has the launch vehicle, &quot;Atlas 5,&quot; in the operator field and no usable longitude. Until October 22, 2026, Clarke showed no operator for the slot because of that row. We fixed the parsing that day, and the slot now shows US Space Force / DoD Space Test Program. NASA&apos;s LCRD is a{" "}
        <Ext href="https://www.nasa.gov/directorates/stmd/tech-demo-missions-program/laser-communications-relay-demonstration-lcrd-overview/">hosted payload on STPSat-6</Ext>, a Department of Defense Space Test Program satellite.
      </p>

      <p id="note-c">
        <strong>(c) None of the five has an FCC row.</strong> The FCC list covers{" "}
        <Ext href="https://www.fcc.gov/approved-space-station-list">space stations the FCC licenses, plus non-US satellites granted access to the US market</Ext>. So most non-US satellites, including Eutelsat 9B, Inmarsat 4A-F4, EDRS-C and JDRS-1, do not appear. US federal satellites such as STPSat-6 get spectrum through the{" "}
        <Ext href="https://www.fcc.gov/space/national-us-coordination-federal-and-non-federal">National Telecommunications and Information Administration</Ext> (NTIA) instead of an FCC license. A hosted payload, such as EDRS-A on Eutelsat 9B, does not get a row of its own either.
      </p>

      <p>
        <strong>What we left out.</strong> China&apos;s Shijian-20, now at{" "}
        <Ext href="https://www.clarkebelt.finance/api/v1/agents/slots/40e">40.16°E</Ext>,{" "}
        <Ext href="https://www.cast.cn/news/6776">tested a 10 Gbps laser link to the ground in 2020</Ext>, but that was a direct downlink, and we found no public record of a Chinese GEO satellite relaying another spacecraft&apos;s data by laser. China&apos;s Tianlian relay satellites are described as{" "}
        <Ext href="https://www.chinanews.com.cn/gn/2025/03-27/10389692.shtml">radio relays</Ext>. ESA&apos;s ARTEMIS relay, which carried the SILEX laser terminal,{" "}
        <Ext href="https://www.eoportal.org/satellite-missions/artemis">reached end of life in November 2017</Ext>. GEOLITE, a 2001 US satellite on the{" "}
        <Ext href="https://ntrs.nasa.gov/api/citations/20240016424/downloads/Laser%20Communications%20to%20Enable%20Space%20Exploration.pdf">MIT Lincoln Laboratory timeline</Ext>, has no public documentation of a relay role.
      </p>

      <h2 id="how-these-relays-came-about">How these relays came about</h2>
      <p>
        A satellite in low Earth orbit (LEO) circles the planet in about 100 minutes and can only send data down when it passes over a ground station.{" "}
        <Ext href="https://www.esa.int/Applications/Connectivity_and_Secure_Communications/EDRS/Laser_communications">ESA says</Ext> this usually leaves about 10 minutes out of every 100. A relay in GEO stays over one longitude, so it can catch data from a passing LEO satellite and forward it to the ground straight away.
      </p>
      <p>
        The MIT Lincoln Laboratory timeline lists ESA&apos;s SILEX experiment in 2001 and Japan&apos;s OICETS in 2005. Both{" "}
        <Ext href="https://www.eoportal.org/satellite-missions/artemis">linked LEO satellites to ARTEMIS</Ext> by laser. In November 2014, ESA&apos;s Sentinel-1A radar satellite{" "}
        <Ext href="https://resilience.esa.int/archives/news/linking-laser-fast-data-delivery-0">linked by laser to Alphasat</Ext>, whose test terminal was built by Tesat. EDRS-A, a payload on Eutelsat 9B,{" "}
        <Ext href="https://www.esa.int/Applications/Connectivity_and_Secure_Communications/EDRS/Overview">launched on January 29, 2016</Ext>, and EDRS-C followed in 2019. ESA lists the laser link at up to 1,800 Mbit/s, with a Ka-band radio link from the relay to the ground. Airbus, which{" "}
        <Ext href="https://www.airbus.com/en/products-services/defence/military-space/space-data-highway">owns and operates EDRS</Ext>, said the service had passed 80,000 laser connections in 2024, and in December 2025{" "}
        <Ext href="https://www.linkedin.com/posts/airbus-geospatial-and-secure-connectivity-solutions_airbus-edrs-spacedatahighway-activity-7407706378074574848-YyFR">posted on LinkedIn that it had passed 100,000</Ext>. We found the 100,000 figure only in that LinkedIn post.
      </p>
      <p>
        NASA&apos;s LCRD{" "}
        <Ext href="https://www.nasa.gov/directorates/stmd/tech-demo-missions-program/laser-communications-relay-demonstration-lcrd-overview/">launched on December 7, 2021</Ext> and began experiments in June 2022. Its first user in orbit, the ILLUMA-T terminal on the International Space Station, made its first link on December 5, 2023, sent data at 1.2 Gbps, and was decommissioned after testing ended on June 29, 2024. LCRD finished its two-year program that month and{" "}
        <Ext href="https://ntrs.nasa.gov/citations/20250011578">has run in an extended experiment phase since</Ext>.
      </p>
      <p>
        In January 2025,{" "}
        <Ext href="https://global.jaxa.jp/press/2025/01/20250123-1_e.html">JAXA and NEC reported</Ext> the first transfer of observation data from the ALOS-4 radar satellite to the ground through JDRS-1, at 1.8 Gbps.
      </p>

      <h2 id="why-lasers-and-what-limits-them">Why lasers, and what limits them</h2>
      <p>
        NASA says laser links can carry{" "}
        <Ext href="https://www.nasa.gov/goddard/esc/lcrd/">10 to 100 times more data</Ext> than radio. JAXA puts the usable bandwidth near 1.5 micrometers at{" "}
        <Ext href="https://global.jaxa.jp/press/2025/01/20250123-1_e.html">about 5 THz</Ext>, and says the LUCAS beam spreads to only about 500 m over 40,000 km. Clouds block that light, so NASA chose high, mostly clear sites for LCRD&apos;s two optical ground stations, in California and Hawaii, and calls the ability to switch between stations{" "}
        <Ext href="https://www.nasa.gov/directorates/stmd/tech-demo-missions-program/laser-communications-relay-demonstration-lcrd-overview/">&quot;essential to reliable service.&quot;</Ext>
      </p>
      <p>
        Laser links also sit outside most spectrum rules. The International Telecommunication Union&apos;s radio rules cover frequencies up to 3,000 GHz, and an{" "}
        <Ext href="https://www.itu.int/net/ITU-R/information/promotion/e-flash/4/article3.html">ITU note</Ext> says interference between optical links between satellites is very unlikely. The MIT Lincoln Laboratory deck lists optical as{" "}
        <Ext href="https://ntrs.nasa.gov/api/citations/20240016424/downloads/Laser%20Communications%20to%20Enable%20Space%20Exploration.pdf">&quot;unregulated&quot;</Ext>, with care needed around aircraft and sensor satellites. The host satellites still use radio. LCRD is{" "}
        <Ext href="https://ntrs.nasa.gov/citations/20250011578">normally commanded over STPSat-6&apos;s radio link</Ext>, and EDRS sends data to the ground in Ka-band, so each host still needs its normal radio filings.
      </p>

      <h2 id="deep-space-is-a-different-setup">Deep space is a different setup</h2>
      <p>
        NASA&apos;s Deep Space Optical Communications experiment on the Psyche mission sent data straight to telescopes at Palomar and Table Mountain, with no GEO relay involved. It{" "}
        <Ext href="https://www.nasa.gov/directorates/stmd/tech-demo-missions-program/deep-space-optical-communications-dsoc/nasas-deep-space-communications-demo-exceeds-project-expectations/">streamed video from more than 30 million km</Ext> in December 2023 and downlinked data from about 494 million km on December 3, 2024. A GEO relay for deep-space links exists only as a{" "}
        <Ext href="https://ntrs.nasa.gov/api/citations/20160009224/downloads/20160009224.pdf">2014 NASA study concept</Ext>. We found no such hardware in orbit.
      </p>

      <h2 id="planned-relays">Planned relays</h2>
      <p>
        Space Compass, a joint venture of NTT and SKY Perfect JSAT, signed with Swissto12 in March 2026 for{" "}
        <Ext href="https://space-compass.com/en/news/000084.html">what it calls the first commercial GEO optical data relay satellite</Ext>, with no slot published. The U.S. Space Force is funding{" "}
        <Ext href="https://www.ga.com/ga-selected-for-phase-3-of-us-space-force-enterprise-space-terminal-program-following-successful-laser-crosslink-verification">standard optical terminals</Ext> and router satellites for its{" "}
        <Ext href="https://breakingdefense.com/2026/08/space-force-brings-5-companies-on-board-space-data-network/">Space Data Network</Ext>, but the contracted backbone and the Space Development Agency&apos;s Transport Layer are in LEO, and no GEO position has been announced.
      </p>
      <p>
        For now, the list is short: five satellites, and one of them, EDRS-C, has moved more than 110 degrees east while two ESA pages still list the old slot. Published positions for these relays go out of date, so check the tracking data before relying on any of them.
      </p>

      <h2 id="sources">Sources</h2>
      <ol className="text-faint text-xs space-y-1 font-mono">
        <li><Ext href="https://www.esa.int/Applications/Connectivity_and_Secure_Communications/EDRS/Laser_communications">ESA&apos;s EDRS page</Ext></li>
        <li><Ext href="https://swe.ssa.esa.int/ngrm">ESA&apos;s space weather service</Ext></li>
        <li><Ext href="https://space.oscar.wmo.int/satellites/view/edrs_c">World Meteorological Organization&apos;s satellite database</Ext></li>
        <li><Ext href="https://www.clarkebelt.finance/api/v1/agents/slots/142-5e">142.52°E</Ext></li>
        <li><Ext href="https://www.clarkebelt.finance/">Clarke</Ext></li>
        <li><Ext href="https://www.ucs.org/resources/satellite-database">current through May 1, 2023</Ext></li>
        <li><Ext href="https://ntrs.nasa.gov/citations/20250011578">Experiment, in extended phase since June 2024</Ext></li>
        <li><Ext href="https://ntrs.nasa.gov/citations/20240011025">112°W (NASA paper)</Ext></li>
        <li><Ext href="https://www.clarkebelt.finance/api/v1/agents/slots/111-9w">111.86°W</Ext></li>
        <li><Ext href="https://www.airbus.com/en/products-services/defence/military-space/space-data-highway">Operational service</Ext></li>
        <li><Ext href="https://www.clarkebelt.finance/api/v1/agents/slots/9e">8.95°E</Ext></li>
        <li><Ext href="https://www.esa.int/Applications/Connectivity_and_Secure_Communications/World-first_gigabit-per-second_laser_link_between_aircraft_and_geostationary_satellite">Demonstration, still in use in 2025</Ext></li>
        <li><Ext href="https://www.esa.int/Applications/Connectivity_and_Secure_Communications/Alphasat/Overview">25°E</Ext></li>
        <li><Ext href="https://www.clarkebelt.finance/api/v1/agents/slots/25e">24.86°E</Ext></li>
        <li><Ext href="https://global.jaxa.jp/press/2025/01/20250123-1_e.html">Operational</Ext></li>
        <li><Ext href="https://www.mext.go.jp/b_menu/shingi/gijyutu/gijyutu2/059/shiryo/__icsFiles/afieldfile/2017/10/27/1397652_4.pdf">90.75°E (JAXA 2017: same slot as its predecessor DRTS)</Ext></li>
        <li><Ext href="http://www.tbs-satellite.com/tse/online/sat_jdrs_1.html">90.7°E (third-party database)</Ext></li>
        <li><Ext href="https://www.clarkebelt.finance/api/v1/agents/slots/91e">90.75°E</Ext></li>
        <li><Ext href="https://www.itu.int/dms_pubrec/itu-r/rec/s/R-REC-S.484-3-199203-I!!PDF-E.pdf">ITU recommendation</Ext></li>
        <li><Ext href="https://www.itu.int/pub/R-REG-RR">Article 22 of the Radio Regulations</Ext></li>
        <li><Ext href="https://www.esa.int/Newsroom/Press_Releases/EDRS-C_successfully_launched">launched EDRS-C on August 6, 2019</Ext></li>
        <li><Ext href="https://resilience.esa.int/archives/partnership-projects/european-data-relay-system-edrs">Connectivity and Secure Communications site</Ext></li>
        <li><Ext href="https://www.clarkebelt.finance/api/v1/agents/slots/31e">31°E slot</Ext></li>
        <li><Ext href="https://www.skyperfectjsat.space/en/news/20260610">SKY Perfect JSAT agreed to buy HYLAS 3</Ext></li>
        <li><Ext href="https://www.esa.int/Applications/Connectivity_and_Secure_Communications/EDRS/Overview">according to ESA</Ext></li>
        <li><Ext href="https://www.nasa.gov/directorates/stmd/tech-demo-missions-program/laser-communications-relay-demonstration-lcrd-overview/">hosted payload on STPSat-6</Ext></li>
        <li><Ext href="https://www.fcc.gov/approved-space-station-list">space stations the FCC licenses, plus non-US satellites granted access to the US market</Ext></li>
        <li><Ext href="https://www.fcc.gov/space/national-us-coordination-federal-and-non-federal">National Telecommunications and Information Administration</Ext></li>
        <li><Ext href="https://www.clarkebelt.finance/api/v1/agents/slots/40e">40.16°E</Ext></li>
        <li><Ext href="https://www.cast.cn/news/6776">tested a 10 Gbps laser link to the ground in 2020</Ext></li>
        <li><Ext href="https://www.chinanews.com.cn/gn/2025/03-27/10389692.shtml">radio relays</Ext></li>
        <li><Ext href="https://www.eoportal.org/satellite-missions/artemis">reached end of life in November 2017</Ext></li>
        <li><Ext href="https://ntrs.nasa.gov/api/citations/20240016424/downloads/Laser%20Communications%20to%20Enable%20Space%20Exploration.pdf">MIT Lincoln Laboratory timeline</Ext></li>
        <li><Ext href="https://resilience.esa.int/archives/news/linking-laser-fast-data-delivery-0">linked by laser to Alphasat</Ext></li>
        <li><Ext href="https://www.linkedin.com/posts/airbus-geospatial-and-secure-connectivity-solutions_airbus-edrs-spacedatahighway-activity-7407706378074574848-YyFR">posted on LinkedIn that it had passed 100,000</Ext></li>
        <li><Ext href="https://www.nasa.gov/goddard/esc/lcrd/">10 to 100 times more data</Ext></li>
        <li><Ext href="https://www.itu.int/net/ITU-R/information/promotion/e-flash/4/article3.html">ITU note</Ext></li>
        <li><Ext href="https://www.nasa.gov/directorates/stmd/tech-demo-missions-program/deep-space-optical-communications-dsoc/nasas-deep-space-communications-demo-exceeds-project-expectations/">streamed video from more than 30 million km</Ext></li>
        <li><Ext href="https://ntrs.nasa.gov/api/citations/20160009224/downloads/20160009224.pdf">2014 NASA study concept</Ext></li>
        <li><Ext href="https://space-compass.com/en/news/000084.html">what it calls the first commercial GEO optical data relay satellite</Ext></li>
        <li><Ext href="https://www.ga.com/ga-selected-for-phase-3-of-us-space-force-enterprise-space-terminal-program-following-successful-laser-crosslink-verification">standard optical terminals</Ext></li>
        <li><Ext href="https://breakingdefense.com/2026/08/space-force-brings-5-companies-on-board-space-data-network/">Space Data Network</Ext></li>
      </ol>
    </div>
  );
}
