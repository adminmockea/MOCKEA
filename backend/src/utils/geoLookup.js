import geoip from "geoip-lite";

// Mapping of 2-letter ISO country codes to country name and flag emoji
const COUNTRY_MAP = {
  BD: { name: "Bangladesh", flag: "🇧🇩" },
  US: { name: "United States", flag: "🇺🇸" },
  GB: { name: "United Kingdom", flag: "🇬🇧" },
  IN: { name: "India", flag: "🇮🇳" },
  AU: { name: "Australia", flag: "🇦🇺" },
  CA: { name: "Canada", flag: "🇨🇦" },
  VN: { name: "Vietnam", flag: "🇻🇳" },
  PK: { name: "Pakistan", flag: "🇵🇰" },
  NP: { name: "Nepal", flag: "🇳🇵" },
  PH: { name: "Philippines", flag: "🇵🇭" },
  NG: { name: "Nigeria", flag: "🇳🇬" },
  AE: { name: "United Arab Emirates", flag: "🇦🇪" },
  SA: { name: "Saudi Arabia", flag: "🇸🇦" },
  MY: { name: "Malaysia", flag: "🇲🇾" },
  SG: { name: "Singapore", flag: "🇸🇬" },
  NZ: { name: "New Zealand", flag: "🇳🇿" },
  DE: { name: "Germany", flag: "🇩🇪" },
  FR: { name: "France", flag: "🇫🇷" },
  IT: { name: "Italy", flag: "🇮🇹" },
  ES: { name: "Spain", flag: "🇪🇸" },
  BR: { name: "Brazil", flag: "🇧🇷" },
  ID: { name: "Indonesia", flag: "🇮🇩" },
  TR: { name: "Turkey", flag: "🇹🇷" },
  EG: { name: "Egypt", flag: "🇪🇬" },
  ZA: { name: "South Africa", flag: "🇿🇦" },
  CN: { name: "China", flag: "🇨🇳" },
  JP: { name: "Japan", flag: "🇯🇵" },
  KR: { name: "South Korea", flag: "🇰🇷" },
  IE: { name: "Ireland", flag: "🇮🇪" },
  SE: { name: "Sweden", flag: "🇸🇪" },
  NL: { name: "Netherlands", flag: "🇳🇱" },
  TH: { name: "Thailand", flag: "🇹🇭" },
  LK: { name: "Sri Lanka", flag: "🇱🇰" },
  KE: { name: "Kenya", flag: "🇰🇪" },
  GH: { name: "Ghana", flag: "🇬🇭" },
};

/**
 * Get flag emoji for ISO country code
 */
export const getCountryFlag = (code) => {
  if (!code || code === "UN" || code === "UNKNOWN") return "🌐";
  const upper = code.toUpperCase();
  if (COUNTRY_MAP[upper]) return COUNTRY_MAP[upper].flag;
  try {
    // Generate regional indicator symbol flag
    const codePoints = upper
      .slice(0, 2)
      .split("")
      .map((c) => 127397 + c.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch (err) {
    return "🌐";
  }
};

/**
 * Get country name for ISO code
 */
export const getCountryName = (code) => {
  if (!code || code === "UN" || code === "UNKNOWN") return "Unknown";
  const upper = code.toUpperCase();
  return COUNTRY_MAP[upper]?.name || upper;
};

/**
 * Clean and extract IP from request headers or socket
 */
export const extractClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  let rawIp = forwarded ? forwarded.split(",")[0].trim() : (req.headers["x-real-ip"] || req.socket?.remoteAddress || req.ip || "");
  
  // Strip IPv6 prefix if present in local environments, e.g. ::ffff:192.168.1.1
  const cleanIp = rawIp.replace(/^.*:/, "").trim();
  return cleanIp || "127.0.0.1";
};

/**
 * Parse User-Agent for device, browser, and OS
 */
export const parseUserAgent = (userAgent = "") => {
  const ua = userAgent.toLowerCase();

  // Device detection
  let device = "desktop";
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    device = "tablet";
  } else if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
    device = "mobile";
  }

  // OS detection
  let os = "Other";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/linux/i.test(ua)) os = "Linux";

  // Browser detection
  let browser = "Other";
  if (/edg/i.test(ua)) browser = "Edge";
  else if (/opr\//i.test(ua) || /opera/i.test(ua)) browser = "Opera";
  else if (/chrome|crios/i.test(ua)) browser = "Chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";

  return { device, browser, os };
};

/**
 * Resolve client location from headers or GeoIP
 */
export const resolveLocation = (req) => {
  const ip = extractClientIp(req);

  // 1. Check edge cloud headers (Vercel, Cloudflare)
  const headerCountry = (req.headers["x-vercel-ip-country"] || req.headers["cf-ipcountry"] || "").trim().toUpperCase();
  const headerCity = (req.headers["x-vercel-ip-city"] || "").trim();
  const headerRegion = (req.headers["x-vercel-ip-country-region"] || "").trim();

  if (headerCountry && headerCountry !== "XX" && headerCountry !== "T1") {
    return {
      ip,
      countryCode: headerCountry,
      country: getCountryName(headerCountry),
      city: headerCity || "Unknown",
      region: headerRegion || "",
    };
  }

  // 2. Check GeoIP database lookup
  const isLocal = ip === "127.0.0.1" || ip === "localhost" || ip.startsWith("192.168.") || ip.startsWith("10.");
  if (!isLocal) {
    try {
      const geo = geoip.lookup(ip);
      if (geo && geo.country) {
        return {
          ip,
          countryCode: geo.country.toUpperCase(),
          country: getCountryName(geo.country),
          city: geo.city || "Unknown",
          region: geo.region || "",
        };
      }
    } catch (err) {
      console.warn("GeoIP lookup failed:", err.message);
    }
  }

  // 3. Fallback: local development or unknown public IP
  return {
    ip,
    countryCode: isLocal ? "LOCAL" : "UN",
    country: isLocal ? "Local Environment" : "Unknown",
    city: isLocal ? "Development" : "Unknown",
    region: "",
  };
};
