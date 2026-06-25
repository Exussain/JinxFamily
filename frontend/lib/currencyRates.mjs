import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const TGJU_CURRENCY_URL = "https://www.tgju.org/currency";

function parseNumericPrice(value) {
  const normalized = String(value || "").replace(/[^\d]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function extractMarketPrice(html, marketRow) {
  const pattern = new RegExp(
    `(?:data-market-row|data-market-nameslug)=["']${marketRow}["'][\\s\\S]{0,5000}?data-price=["']([^"']+)["']`,
    "i",
  );
  const match = html.match(pattern);
  return parseNumericPrice(match?.[1]);
}

export function parseTgjuCurrencyRates(html) {
  const usd = extractMarketPrice(html, "price_dollar_rl");
  const tryRate = extractMarketPrice(html, "price_try");

  if (!usd || !tryRate) {
    throw new Error("Could not parse TGJU USD/TRY rates");
  }

  return {
    usd,
    try: tryRate,
  };
}

let cachedRates = null;
let isFetching = false;
let lastFetchTime = 0;
let fetchPromise = null;
const CACHE_TTL = 60000; // 60 seconds

async function doFetchTgjuCurrencyRates() {
  try {
    const { stdout, stderr } = await execAsync(
      '/usr/bin/curl -s -L --connect-timeout 10 -m 25 "https://www.tgju.org/currency"',
      { maxBuffer: 5 * 1024 * 1024 }
    );
    
    if (!stdout || stdout.length < 1000) {
      throw new Error("Curl returned empty or too small response. Stderr: " + stderr);
    }

    const html = stdout;
    const rates = {
      ...parseTgjuCurrencyRates(html),
      source: TGJU_CURRENCY_URL,
      fetchedAt: new Date().toISOString(),
    };
    
    cachedRates = rates;
    lastFetchTime = Date.now();
    return rates;
  } catch (err) {
    console.error("Currency fetch failed:", err.message);
    if (err.stdout) console.error("STDOUT:", err.stdout.substring(0, 500));
    if (err.stderr) console.error("STDERR:", err.stderr);
    throw err;
  }
}

export async function fetchTgjuCurrencyRates() {
  const now = Date.now();
  
  if (cachedRates && now - lastFetchTime < CACHE_TTL) {
    return cachedRates;
  }

  if (isFetching && fetchPromise) {
    if (cachedRates) {
      return cachedRates;
    }
    return fetchPromise;
  }

  isFetching = true;
  fetchPromise = doFetchTgjuCurrencyRates()
    .then(rates => {
      isFetching = false;
      fetchPromise = null;
      return rates;
    })
    .catch(err => {
      isFetching = false;
      fetchPromise = null;
      if (cachedRates) {
        return cachedRates;
      }
      
      console.warn("Using fallback currency rates due to fetch failure.");
      return {
        usd: 600000,
        try: 18500,
        source: "fallback",
        fetchedAt: new Date().toISOString(),
      };
    });

  if (cachedRates) {
    return cachedRates;
  }

  return fetchPromise;
}
