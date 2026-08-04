import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const base = (process.env.LIGHTHOUSE_BASE_URL || 'http://127.0.0.1:3002').replace(/\/$/, '');
const routes = (process.env.LIGHTHOUSE_ROUTES || '/,/products,/product/chatgpt-subscription,/checkout').split(',');
const runs = Number(process.env.LIGHTHOUSE_RUNS || 3);
const thresholds = { score: 0.9, lcp: 2500, tbt: 200, cls: 0.1, transfer: 750 * 1024, requests: 40 };
const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'] });

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
let failed = false;
try {
  for (const route of routes) {
    const samples = [];
    for (let run = 0; run < runs; run += 1) {
      const result = await lighthouse(`${base}${route}`, {
        port: chrome.port,
        output: 'json',
        logLevel: 'error',
        onlyCategories: ['performance'],
        formFactor: 'mobile',
        throttlingMethod: 'simulate',
      });
      const audits = result.lhr.audits;
      samples.push({
        score: result.lhr.categories.performance.score,
        lcp: audits['largest-contentful-paint'].numericValue,
        tbt: audits['total-blocking-time'].numericValue,
        cls: audits['cumulative-layout-shift'].numericValue,
        transfer: audits['resource-summary'].details.items.find((item) => item.resourceType === 'total')?.transferSize || 0,
        requests: audits['resource-summary'].details.items.find((item) => item.resourceType === 'total')?.requestCount || 0,
      });
    }
    const result = Object.fromEntries(Object.keys(samples[0]).map((key) => [key, median(samples.map((sample) => sample[key]))]));
    console.log(`${route}: score ${Math.round(result.score * 100)}, LCP ${Math.round(result.lcp)}ms, TBT ${Math.round(result.tbt)}ms, CLS ${result.cls.toFixed(3)}, transfer ${(result.transfer / 1024).toFixed(0)}KB, ${Math.round(result.requests)} requests`);
    if (result.score < thresholds.score || result.lcp > thresholds.lcp || result.tbt > thresholds.tbt || result.cls > thresholds.cls || result.transfer > thresholds.transfer || result.requests > thresholds.requests) failed = true;
  }
} finally {
  await chrome.kill();
}
if (failed) throw new Error('Median mobile Lighthouse thresholds were not met.');
