import { exec } from "child_process";
import { promisify } from "util";
import { parseTgjuCurrencyRates } from "./lib/currencyRates.mjs";

const execAsync = promisify(exec);

async function run() {
  try {
    const { stdout } = await execAsync('curl -s -L --connect-timeout 10 -m 20 "https://www.tgju.org/currency"');
    const rates = parseTgjuCurrencyRates(stdout);
    console.log("Success with curl:", rates);
  } catch (err) {
    console.error("Error with curl:", err);
  }
}

run();
