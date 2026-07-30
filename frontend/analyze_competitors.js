const { chromium } = require('playwright');
const fs = require('fs');

async function analyzeCompetitors() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 }
  });

  const domains = [
    { name: 'G4A4', domain: 'g4a4.com' },
    { name: 'Iranicard', domain: 'iranicard.ir' },
    { name: 'IranMojo', domain: 'iranmojo.com' }
  ];

  const results = [];

  for (let i = 0; i < domains.length; i++) {
    const comp = domains[i];
    console.log(`\n========================================`);
    console.log(`Visiting competitor ${i+1}/${domains.length}: ${comp.name} (${comp.domain})`);
    console.log(`========================================`);

    const siteResult = {
      name: comp.name,
      domain: comp.domain,
      title: '',
      meta_description: '',
      viewport_meta: false,
      schema_usage: [],
      price_in_schema_details: [],
      price_in_schema_correct: false,
      speed_impression: 'medium',
      content_depth_score: '3',
      eeat_signals: [],
      internal_linking_patterns: [],
      strengths: [],
      weaknesses: [],
      exploitable_gaps: [],
      home_word_count: 0,
      prod_word_count: 0,
      load_time_ms: 0,
      error: null
    };

    const page = await context.newPage();
    const startTime = Date.now();

    try {
      const response = await page.goto(`https://${comp.domain}`, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await page.waitForTimeout(3000);
      siteResult.load_time_ms = Date.now() - startTime;

      siteResult.title = await page.title();

      // Viewport meta
      const viewport = await page.$('meta[name="viewport"]');
      siteResult.viewport_meta = viewport !== null;

      // Meta description
      const metaDesc = await page.$eval('meta[name="description"]', el => el.getAttribute('content')).catch(() => '');
      siteResult.meta_description = metaDesc;

      // Extract JSON-LD schemas
      const jsonLdScripts = await page.$$eval('script[type="application/ld+json"]', scripts => 
        scripts.map(s => {
          try { return JSON.parse(s.textContent); } catch(e) { return null; }
        }).filter(Boolean)
      );

      const schemaTypes = new Set();
      jsonLdScripts.forEach(s => {
        if (Array.isArray(s)) {
          s.forEach(item => item && item['@type'] && schemaTypes.add(item['@type']));
        } else if (s && s['@type']) {
          schemaTypes.add(s['@type']);
        }
        if (s && s['@graph'] && Array.isArray(s['@graph'])) {
          s['@graph'].forEach(g => g && g['@type'] && schemaTypes.add(g['@type']));
        }
      });
      siteResult.schema_usage = Array.from(schemaTypes);

      // EEAT Signals & content depth
      const links = await page.$$eval('a', anchors => anchors.map(a => ({ href: a.href, text: a.innerText })));
      const pageText = await page.evaluate(() => document.body.innerText || '');
      siteResult.home_word_count = pageText.split(/\s+/).filter(Boolean).length;

      const hasAbout = links.some(l => l.href.includes('about') || l.text.includes('درباره'));
      const hasContact = links.some(l => l.href.includes('contact') || l.text.includes('تماس'));
      const hasBlog = links.some(l => l.href.includes('blog') || l.href.includes('mag') || l.text.includes('بلاگ') || l.text.includes('مجله'));
      const hasEnamad = pageText.includes('ای‌نماد') || pageText.includes('اینماد') || pageText.includes('enamad') || pageText.includes('کسب و کارهای اینترنتی');
      const hasSamandehi = pageText.includes('ساماندهی') || pageText.includes('samandehi');
      const hasPhone = /\d{8,11}/.test(pageText) || pageText.includes('پشتیبانی') || pageText.includes('تلفن');
      const hasAddress = pageText.includes('آدرس') || pageText.includes('تهران') || pageText.includes('خیابان');

      if (hasAbout) siteResult.eeat_signals.push('About Us Page');
      if (hasContact) siteResult.eeat_signals.push('Contact Page / Support details');
      if (hasBlog) siteResult.eeat_signals.push('Blog / Magazine Content Hub');
      if (hasEnamad) siteResult.eeat_signals.push('eNamad Trust Badge');
      if (hasSamandehi) siteResult.eeat_signals.push('Samandehi Trust Badge');
      if (hasPhone) siteResult.eeat_signals.push('Dedicated phone line support');
      if (hasAddress) siteResult.eeat_signals.push('Physical office address');

      // Internal links analysis
      const internalLinks = links.filter(l => l.href.includes(comp.domain) || l.href.startsWith('/'));
      siteResult.internal_linking_patterns.push(`Category & navigation internal links: ${internalLinks.length}`);
      if (hasBlog) siteResult.internal_linking_patterns.push('Blog to product category contextual cross-linking');

      // Sample a product page
      const prodLink = links.find(l => 
        (l.href.includes('product') || l.href.includes('shop') || l.href.includes('/p/') || l.href.includes('خرید') || l.href.includes('گیفت-کارت') || l.href.includes('گیفت')) && 
        !l.href.includes('login') && !l.href.includes('cart')
      );

      if (prodLink) {
        console.log(`Navigating to sample product page: ${prodLink.href}`);
        try {
          await page.goto(prodLink.href, { waitUntil: 'domcontentloaded', timeout: 20000 });
          await page.waitForTimeout(2000);

          const prodPageText = await page.evaluate(() => document.body.innerText || '');
          siteResult.prod_word_count = prodPageText.split(/\s+/).filter(Boolean).length;

          const prodJsonLd = await page.$$eval('script[type="application/ld+json"]', scripts => 
            scripts.map(s => {
              try { return JSON.parse(s.textContent); } catch(e) { return null; }
            }).filter(Boolean)
          );

          let foundPriceInSchema = false;
          let schemaPrice = null;

          const checkProductObj = (obj) => {
            if (!obj) return;
            if (obj['@type'] === 'Product' && obj.offers) {
              const offer = Array.isArray(obj.offers) ? obj.offers[0] : obj.offers;
              if (offer && (offer.price !== undefined || offer.lowPrice !== undefined)) {
                foundPriceInSchema = true;
                schemaPrice = offer.price || offer.lowPrice;
                siteResult.price_in_schema_details.push(offer);
              }
            }
          };

          prodJsonLd.forEach(s => {
            if (Array.isArray(s)) s.forEach(checkProductObj);
            else {
              checkProductObj(s);
              if (s['@graph'] && Array.isArray(s['@graph'])) s['@graph'].forEach(checkProductObj);
            }
          });

          siteResult.price_in_schema_correct = foundPriceInSchema;
          console.log(`Product page schema price found: ${foundPriceInSchema} (${schemaPrice})`);
        } catch (pe) {
          console.log(`Product page fetch error: ${pe.message}`);
        }
      }

    } catch (e) {
      console.log(`Error visiting ${comp.domain}: ${e.message}`);
      siteResult.error = e.message;
    } finally {
      await page.close();
    }

    // Determine speed impression & content depth score
    if (siteResult.load_time_ms < 3000) siteResult.speed_impression = 'fast';
    else if (siteResult.load_time_ms < 7000) siteResult.speed_impression = 'medium';
    else siteResult.speed_impression = 'slow';

    if (siteResult.prod_word_count > 1500 || siteResult.home_word_count > 2500) {
      siteResult.content_depth_score = '5';
    } else if (siteResult.prod_word_count > 800 || siteResult.home_word_count > 1200) {
      siteResult.content_depth_score = '4';
    } else if (siteResult.prod_word_count > 400 || siteResult.home_word_count > 600) {
      siteResult.content_depth_score = '3';
    } else if (siteResult.home_word_count > 200) {
      siteResult.content_depth_score = '2';
    } else {
      siteResult.content_depth_score = '1';
    }

    results.push(siteResult);

    // RATE LIMIT: 5s between site visits
    if (i < domains.length - 1) {
      console.log('Enforcing 5s rate limit before visiting next site...');
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  await browser.close();
  fs.writeFileSync('/root/NubixShop/public/competitor_analysis_raw.json', JSON.stringify(results, null, 2));
  console.log('\nAnalysis completed and saved to competitor_analysis_raw.json');
}

analyzeCompetitors();
