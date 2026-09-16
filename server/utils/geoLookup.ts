import geoip from "geoip-lite";

// Translate common country codes to display names to match frontend expectations
const COUNTRY_MAP: { [key: string]: string } = {
  US: "United States",
  IN: "India",
  GB: "United Kingdom",
  DE: "Germany",
  CA: "Canada",
  AU: "Australia",
  JP: "Japan",
  FR: "France",
  SG: "Singapore",
  JP_JA: "Japan",
  BR: "Brazil",
};

const DEV_LOCATIONS = [
  { country: "United States", city: "San Francisco" },
  { country: "India", city: "Bengaluru" },
  { country: "United Kingdom", city: "London" },
  { country: "Germany", city: "Berlin" },
  { country: "Canada", city: "Toronto" },
  { country: "Singapore", city: "Singapore" },
  { country: "Japan", city: "Tokyo" },
];

export function getGeoIP(ipAddress: string): { country: string; city: string; timezone: string } {
  const cleanIp = ipAddress.replace("::ffff:", "").trim();

  // Handle local loops or private IPs
  if (
    !cleanIp ||
    cleanIp === "127.0.0.1" ||
    cleanIp === "::1" ||
    cleanIp.startsWith("10.") ||
    cleanIp.startsWith("192.168.") ||
    cleanIp.startsWith("172.") ||
    cleanIp === "Anonymous" ||
    cleanIp === "localhost"
  ) {
    // Return a random active dev location to make local environments engaging and diagnostic-friendly
    const fallback = DEV_LOCATIONS[Math.floor(Math.random() * DEV_LOCATIONS.length)];
    return {
      country: fallback.country,
      city: fallback.city,
      timezone: "America/Los_Angeles", // Default timezone for logs
    };
  }

  try {
    const geo = geoip.lookup(cleanIp);
    if (geo) {
      const mappedCountry = COUNTRY_MAP[geo.country] || geo.country || "Other";
      return {
        country: mappedCountry,
        city: geo.city || "Other",
        timezone: geo.timezone || "UTC",
      };
    }
  } catch (err) {
    console.error("GeoIP parse error for IP: " + cleanIp, err);
  }

  // Final fallback
  const d = DEV_LOCATIONS[0];
  return { country: d.country, city: d.city, timezone: "UTC" };
}
