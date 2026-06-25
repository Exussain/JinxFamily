import assert from "node:assert/strict";
import { parseTgjuCurrencyRates } from "./currencyRates.mjs";

const sampleHtml = `
  <tr data-market-row="price_dollar_rl" data-price="1,754,200">
    <th>دلار</th>
    <td class="nf">1,754,200</td>
  </tr>
  <tr data-market-row="price_try" data-price="38,800">
    <th>لیر ترکیه</th>
    <td class="nf">38,800</td>
  </tr>
`;

const rates = parseTgjuCurrencyRates(sampleHtml);

assert.equal(rates.usd, 1754200);
assert.equal(rates.try, 38800);

const tooltipHtml = `
  <tr data-market-row="price_dollar_rl" data-title="<div><span>tooltip</span></div>" data-price="1,724,000">
    <td class="nf">1,724,000</td>
  </tr>
  <tr data-market-row="price_try" data-title="<div><span>tooltip</span></div>" data-price="37,600">
    <td class="nf">37,600</td>
  </tr>
`;

const tooltipRates = parseTgjuCurrencyRates(tooltipHtml);

assert.equal(tooltipRates.usd, 1724000);
assert.equal(tooltipRates.try, 37600);
