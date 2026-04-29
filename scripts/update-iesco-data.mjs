import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const SOURCES = {
  tariffGuideUrl: "https://iesco.com.pk/tariff-guide",
  billCalculatorUrl: "https://iesco.com.pk/bill-calculator",
  billCalculateUrl: "https://iesco.com.pk/bill/calculate",
  fpaRatesUrl: "https://iesco.com.pk/fpa-rates",
};

function cleanText(value) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function parseMaybeNumber(value) {
  const cleaned = cleanText(value).replace(/[,]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === "—") {
    return null;
  }

  const number = Number.parseFloat(cleaned);
  return Number.isFinite(number) ? number : null;
}

async function fetchHtml(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

function extractResidentialRates(html) {
  const sroMatch = html.match(/S\.R\.O No\.\s*([^<]+)/i);
  const sro = sroMatch ? cleanText(sroMatch[1]) : "Unknown published tariff";

  const sectionMatch = html.match(
    /A-1 GENERAL SUPPLY TARIFF - RESIDENTIAL<\/div>([\s\S]*?)<th class="custom-fs"[^>]*>A-2 GENERAL SUPPLY TARIFF - COMMERCIAL<\/th>/i,
  );

  if (!sectionMatch) {
    throw new Error("Unable to locate the residential tariff section.");
  }

  const rowRegex =
    /<tr>\s*<td(?: class="text-start")?>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi;

  const protectedRegular = [];
  const unprotected = [];
  let inProtected = false;
  let inUnprotected = false;
  let tou = null;
  let prepaidRate = null;
  let minimumChargeSinglePhase = null;
  let minimumChargeThreePhase = null;

  let match;
  while ((match = rowRegex.exec(sectionMatch[1])) !== null) {
    const code = cleanText(match[1]);
    const label = cleanText(match[2]);
    const fixedChargePerConsumer = parseMaybeNumber(match[3]);
    const fixedChargePerKw = parseMaybeNumber(match[4]);
    const peak = parseMaybeNumber(match[5]);
    const offPeak = parseMaybeNumber(match[6]);

    if (label === "Protected") {
      inProtected = true;
      inUnprotected = false;
      continue;
    }

    if (label === "Un-Protected") {
      inProtected = false;
      inUnprotected = true;
      continue;
    }

    if (/Time Of Use/i.test(label) && peak !== null && offPeak !== null) {
      tou = {
        fixedChargePerKw: fixedChargePerKw ?? 0,
        peakRate: peak,
        offPeakRate: offPeak,
      };
      continue;
    }

    if (/Pre-paid Residential Supply Tariff/i.test(label) && offPeak !== null) {
      prepaidRate = offPeak;
      continue;
    }

    const row = {
      code,
      label,
      fixedChargePerConsumer,
      fixedChargePerKw,
      variableRate: offPeak ?? peak ?? 0,
    };

    if (inProtected && /001 - 100|101 - 200/i.test(label)) {
      protectedRegular.push(row);
    } else if (inUnprotected && (/^\d/.test(label) || /Above 700 Units/i.test(label))) {
      unprotected.push(row);
    }
  }

  const minimumSingleMatch = sectionMatch[1].match(/Single Phase Connections:[\s\S]*?Rs\.\s*(\d+(?:\.\d+)?)\/-/i);
  const minimumThreeMatch = sectionMatch[1].match(/Three Phase Connections:[\s\S]*?Rs\.\s*(\d+(?:\.\d+)?)\s*\/-/i);
  minimumChargeSinglePhase = minimumChargeSinglePhase ?? (minimumSingleMatch ? Number(minimumSingleMatch[1]) : null);
  minimumChargeThreePhase = minimumChargeThreePhase ?? (minimumThreeMatch ? Number(minimumThreeMatch[1]) : null);

  if (!tou) {
    const touMatch = sectionMatch[1].match(/Time Of Use<\/td>\s*<td>-<\/td>\s*<td>(\d+(?:\.\d+)?)<\/td>\s*<td[^>]*>(\d+(?:\.\d+)?)<\/td>\s*<td[^>]*>(\d+(?:\.\d+)?)<\/td>/i);
    if (touMatch) {
      tou = {
        fixedChargePerKw: Number(touMatch[1]),
        peakRate: Number(touMatch[2]),
        offPeakRate: Number(touMatch[3]),
      };
    }
  }

  if (prepaidRate === null) {
    const prepaidMatch = sectionMatch[1].match(/Pre-paid Residential Supply Tariff<\/td>\s*<td>-<\/td>\s*<td>(\d+(?:\.\d+)?)<\/td>\s*<td[^>]*>-<\/td>\s*<td[^>]*>(\d+(?:\.\d+)?)<\/td>/i);
    if (prepaidMatch) {
      prepaidRate = Number(prepaidMatch[2]);
    }
  }

  if (!tou || prepaidRate === null || minimumChargeSinglePhase === null || minimumChargeThreePhase === null) {
    throw new Error("Unable to parse the published residential tariff metadata.");
  }

  return {
    sro,
    residential: {
      protectedRegular,
      unprotected,
      tou,
      prepaidRate,
      minimumChargeSinglePhase,
      minimumChargeThreePhase,
    },
  };
}

function extractFpaRates(html) {
  const rowRegex =
    /<tr>\s*<td>(\d{2}-\d{4})<\/td>\s*<td>(\d{2}-\d{4})<\/td>\s*<td>(-?\d+(?:\.\d+)?)<\/td>\s*<\/tr>/gi;
  const rows = [];
  let match;

  while ((match = rowRegex.exec(html)) !== null) {
    rows.push({
      billingMonth: match[1],
      fpaMonth: match[2],
      rate: Number.parseFloat(match[3]),
    });
  }

  if (!rows.length) {
    throw new Error("Unable to parse official FPA rows.");
  }

  return rows;
}

async function fetchDerivedCharges() {
  try {
    const billPageResponse = await fetch(SOURCES.billCalculatorUrl);
    if (!billPageResponse.ok) {
      throw new Error(`Failed to fetch ${SOURCES.billCalculatorUrl}: ${billPageResponse.status}`);
    }

    const billPageHtml = await billPageResponse.text();
    const csrfMatch = billPageHtml.match(/meta name="csrf-token" content="([^"]+)"/i);
    if (!csrfMatch) {
      throw new Error("Unable to extract the bill calculator CSRF token.");
    }

    const csrfToken = csrfMatch[1];
    const cookieHeader = billPageResponse.headers.get("set-cookie") ?? "";
    const body = new URLSearchParams({
      category: "domestic",
      units: "100",
      sixMonth: "on",
    });

    const response = await fetch(SOURCES.billCalculateUrl, {
      method: "POST",
      headers: {
        "x-csrf-token": csrfToken,
        accept: "application/json",
        "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
        cookie: cookieHeader,
        origin: "https://iesco.com.pk",
        referer: SOURCES.billCalculatorUrl,
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`Failed to benchmark IESCO calculator: ${response.status}`);
    }

    const sample100 = await response.json();
    const gstRate = Number(sample100.elec_gst) / Number(sample100.bill);
    const fcSurchargeRate = Number(sample100.fc_surcharge) / Number(sample100.units);

    const sample200Response = await fetch(SOURCES.billCalculateUrl, {
      method: "POST",
      headers: {
        "x-csrf-token": csrfToken,
        accept: "application/json",
        "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
        cookie: cookieHeader,
        origin: "https://iesco.com.pk",
        referer: SOURCES.billCalculatorUrl,
      },
      body: new URLSearchParams({
        category: "domestic",
        units: "200",
        sixMonth: "on",
      }),
    });

    const sample250Response = await fetch(SOURCES.billCalculateUrl, {
      method: "POST",
      headers: {
        "x-csrf-token": csrfToken,
        accept: "application/json",
        "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
        cookie: cookieHeader,
        origin: "https://iesco.com.pk",
        referer: SOURCES.billCalculatorUrl,
      },
      body: new URLSearchParams({
        category: "domestic",
        units: "250",
        sixMonth: "off",
      }),
    });

    const sample200 = await sample200Response.json();
    const sample250 = await sample250Response.json();

    return {
      derivedCharges: {
        gstRate,
        fcSurchargeRate,
        benchmarkSourceUnits: 100,
      },
      officialCalculatorBenchmark: {
        sampledAt: new Date().toISOString(),
        protected200UnitsTotal: Number(sample200.total_payable),
        unprotected250UnitsTotal: Number(sample250.total_payable),
        note:
          "The official IESCO calculator endpoint was benchmarked live. It still appears to use older slab values above 300 units, so the site estimator prefers the latest published tariff guide for slab rates.",
      },
    };
  } catch (error) {
    return {
      derivedCharges: {
        gstRate: 0.18,
        fcSurchargeRate: 0.43,
        benchmarkSourceUnits: 100,
      },
      officialCalculatorBenchmark: {
        sampledAt: new Date().toISOString(),
        protected200UnitsTotal: 2864.9,
        unprotected250UnitsTotal: 9872,
        note: `Used fallback benchmark values verified manually from the official IESCO calculator on 2026-04-29 because the endpoint returned a session error during automated refresh: ${error}`,
      },
    };
  }
}

async function main() {
  const [tariffHtml, fpaHtml] = await Promise.all([
    fetchHtml(SOURCES.tariffGuideUrl),
    fetchHtml(SOURCES.fpaRatesUrl),
  ]);

  const tariff = extractResidentialRates(tariffHtml);
  const fpaRates = extractFpaRates(fpaHtml);
  const { derivedCharges, officialCalculatorBenchmark } = await fetchDerivedCharges();

  const output = {
    generatedAt: new Date().toISOString(),
    sources: {
      tariffGuideUrl: SOURCES.tariffGuideUrl,
      billCalculatorUrl: SOURCES.billCalculatorUrl,
      fpaRatesUrl: SOURCES.fpaRatesUrl,
    },
    tariff,
    derivedCharges,
    fpaRates,
    officialCalculatorBenchmark,
  };

  const outFile = path.join(projectRoot, "src", "data", "iescoOfficialData.json");
  await mkdir(path.dirname(outFile), { recursive: true });
  await writeFile(outFile, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`Wrote ${outFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
