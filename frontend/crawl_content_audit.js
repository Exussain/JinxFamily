const { chromium } = require('playwright');
const fs = require('fs');

const PAGES = [
  'https://nubixshop.ir/blog',
  'https://nubixshop.ir/blog/guide-buy-vbucks',
  'https://nubixshop.ir/blog/guide-crew-pack',
  'https://nubixshop.ir/blog/guide-buy-chatgpt-plus',
  'https://nubixshop.ir/blog/guide-gemini-advanced',
  'https://nubixshop.ir/blog/guide-buy-steam-giftcard',
  'https://nubixshop.ir/blog/guide-preorder-gta6',
  'https://nubixshop.ir/blog/guide-spotify-premium',
  'https://nubixshop.ir/blog/unlink-xbox-from-epic-games',
  'https://nubixshop.ir/guides/disable-2fa',
  'https://nubixshop.ir/guides/link-unlink',
  'https://nubixshop.ir/guides/remove-restriction',
  'https://nubixshop.ir/faq'
];

const SLEEP_MS = 3000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log('Launching Chromium for Content Optimization Audit...');
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  const auditResults = [];

  for (let i = 0; i < PAGES.length; i++) {
    const targetUrl = PAGES[i];
    console.log(`[${i + 1}/${PAGES.length}] Navigating to: ${targetUrl}`);
    
    let status = 0;
    try {
      const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      status = response ? response.status() : 0;
      await page.waitForTimeout(1000); // allow hydration/render
    } catch (err) {
      console.error(`Error loading ${targetUrl}:`, err.message);
    }

    const pageData = await page.evaluate(() => {
      // Body text word count
      const body = document.querySelector('body');
      const clone = body.cloneNode(true);
      clone.querySelectorAll('script, style, noscript, svg, iframe').forEach(el => el.remove());
      const text = clone.innerText || '';
      const words = text.trim().split(/\s+/).filter(w => w.length > 0);
      const wordCount = words.length;

      // Headings structure
      const headingEls = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const headings = Array.from(headingEls).map(h => ({
        level: h.tagName.toLowerCase(),
        text: h.innerText.trim().replace(/\s+/g, ' ')
      })).filter(h => h.text.length > 0);

      // Meta tags
      const metaTitle = document.title || '';
      const metaDescEl = document.querySelector('meta[name="description"]');
      const metaDesc = metaDescEl ? metaDescEl.getAttribute('content') || '' : '';
      const canonicalEl = document.querySelector('link[rel="canonical"]');
      const canonical = canonicalEl ? canonicalEl.getAttribute('href') || '' : '';
      const metaRobotsEl = document.querySelector('meta[name="robots"]');
      const metaRobots = metaRobotsEl ? metaRobotsEl.getAttribute('content') || '' : '';

      // JSON-LD presence
      const jsonLdScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      const hasJsonLd = jsonLdScripts.some(s => s.textContent && s.textContent.trim().length > 10);

      // Images alt check
      const images = Array.from(document.querySelectorAll('img'));
      const missingAltImages = images.filter(img => {
        const alt = img.getAttribute('alt');
        return alt === null || alt.trim() === '';
      });

      // Internal links & Product links count
      const links = Array.from(document.querySelectorAll('a[href]'));
      let internalLinksCount = 0;
      let productLinksCount = 0;
      const productLinks = [];

      links.forEach(a => {
        const href = a.getAttribute('href');
        if (!href) return;
        
        const isInternal = href.startsWith('/') || href.includes('nubixshop.ir');
        if (isInternal) {
          internalLinksCount++;
          if (
            href.includes('/vbucks') ||
            href.includes('/crewpack') ||
            href.includes('/gta6') ||
            href.includes('/gemini') ||
            href.includes('/lego') ||
            href.includes('/product/') ||
            href.includes('/category/')
          ) {
            productLinksCount++;
            if (!productLinks.includes(href)) productLinks.push(href);
          }
        }
      });

      return {
        wordCount,
        headings,
        metaTitle,
        metaDesc,
        canonical,
        metaRobots,
        hasJsonLd,
        imagesCount: images.length,
        imagesMissingAlt: missingAltImages.length,
        internalLinksCount,
        productLinksCount,
        productLinks
      };
    });

    // Evaluate Quality & Issues
    const issues = [];
    const recommendations = [];
    let quality = 'good';

    if (pageData.wordCount < 300) {
      quality = 'thin';
      issues.push(`Thin content: only ${pageData.wordCount} words.`);
      recommendations.push(`Expand main text content to at least 600+ words with rich, actionable guidance.`);
    } else if (pageData.wordCount < 600) {
      quality = 'adequate';
    } else if (pageData.wordCount >= 1200) {
      quality = 'excellent';
    }

    if (!pageData.metaTitle || pageData.metaTitle.length < 10) {
      issues.push('Missing or too short meta title.');
      recommendations.push('Add an optimized, click-worthy title tag containing target primary keywords.');
    }

    if (!pageData.metaDesc || pageData.metaDesc.length < 30) {
      issues.push('Missing or too short meta description.');
      recommendations.push('Provide a compelling meta description between 120-155 characters.');
    }

    const h1s = pageData.headings.filter(h => h.level === 'h1');
    if (h1s.length === 0) {
      issues.push('Missing H1 heading.');
      recommendations.push('Include exactly one clear H1 tag matching page search intent.');
    } else if (h1s.length > 1) {
      issues.push(`Multiple H1 headings (${h1s.length} found).`);
      recommendations.push('Consolidate H1 tags so there is only 1 primary H1 per page.');
    }

    if (!pageData.hasJsonld) {
      issues.push('Missing JSON-LD structured data.');
      recommendations.push('Add Schema.org Article / FAQPage / TechArticle JSON-LD markup.');
    }

    if (pageData.imagesMissingAlt > 0) {
      issues.push(`${pageData.imagesMissingAlt} images missing alt text.`);
      recommendations.push('Add descriptive, keyword-relevant ALT attributes to all missing images.');
    }

    if (pageData.productLinksCount === 0 && !targetUrl.endsWith('/blog') && !targetUrl.endsWith('/faq')) {
      issues.push('Does not link to any relevant product/landing page.');
      recommendations.push('Add prominent CTAs and inline contextual links pointing to related product pages.');
    }

    auditResults.push({
      url: targetUrl,
      word_count: pageData.wordCount,
      headings: pageData.headings,
      internal_links_count: pageData.internalLinksCount,
      product_links_count: pageData.productLinksCount,
      product_links: pageData.productLinks,
      has_jsonld: pageData.hasJsonld,
      images_missing_alt: pageData.imagesMissingAlt,
      meta_title: pageData.metaTitle,
      meta_description: pageData.metaDesc,
      canonical: pageData.canonical,
      meta_robots: pageData.metaRobots,
      content_quality: quality,
      issues,
      recommendations
    });

    if (i < PAGES.length - 1) {
      console.log(`Waiting ${SLEEP_MS}ms before next navigation...`);
      await sleep(SLEEP_MS);
    }
  }

  await browser.close();

  fs.writeFileSync('/root/jinxfamily/frontend/content_audit_raw.json', JSON.stringify(auditResults, null, 2));
  console.log('Crawl completed! Saved raw results to content_audit_raw.json');
})();
