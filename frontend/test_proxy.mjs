import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch from 'node-fetch'; // if available, or native fetch using dispatcher?
import { parseTgjuCurrencyRates } from './lib/currencyRates.mjs';

async function run() {
  const agent = new HttpsProxyAgent('http://127.0.0.1:10808');
  try {
    const res = await fetch("https://www.tgju.org/currency", {
      agent: agent,
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; JinxFamily/1.0)",
        accept: "text/html,application/xhtml+xml",
      }
    });
    const html = await res.text();
    const rates = parseTgjuCurrencyRates(html);
    console.log("Success with proxy:", rates);
  } catch (err) {
    console.error("Error with proxy:", err);
  }
}

run();
