import { fetchTgjuCurrencyRates } from './lib/currencyRates.mjs';

async function run() {
  try {
    const rates = await fetchTgjuCurrencyRates();
    console.log("Success:", rates);
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
