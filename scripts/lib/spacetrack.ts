import https from "https";

const BASE = "https://www.space-track.org";

export async function login(username: string, password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const body = `identity=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
    const options = {
      method: "POST",
      hostname: "www.space-track.org",
      path: "/ajaxauth/login",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(body),
        "User-Agent": "Clarke/1.0",
      },
    };

    const req = https.request(options, (res) => {
      res.resume();
      res.on("end", () => {
        const raw = res.headers["set-cookie"];
        if (!raw || raw.length === 0) {
          reject(new Error("Login failed: no cookie returned. Check credentials."));
          return;
        }
        const cookie = raw.map((c) => c.split(";")[0]).join("; ");
        resolve(cookie);
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

export async function query(cookie: string, path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "www.space-track.org",
      path,
      headers: {
        Cookie: cookie,
        "User-Agent": "Clarke/1.0",
      },
    };

    https.get(options, (res) => {
      if (res.statusCode === 401) {
        reject(new Error("Space-Track session expired or invalid."));
        return;
      }
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      res.on("error", reject);
    }).on("error", reject);
  });
}

export const PATHS = {
  satcat: "/basicspacedata/query/class/satcat/PERIOD/1400--1480/ECCENTRICITY/0--0.01/CURRENT/Y/DECAY/null-null/orderby/NORAD_CAT_ID/format/json",
  tles: "/basicspacedata/query/class/gp/MEAN_MOTION/0.99--1.01/ECCENTRICITY/0--0.01/EPOCH/%3Enow-30/orderby/NORAD_CAT_ID/format/tle",
};
