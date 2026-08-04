const { chromium } = require('playwright');
const fs = require('fs');

const sleep = ms => new Promise(res => setTimeout(res, ms));

(async () => {
  console.log("Launching Google Chrome via Playwright...");
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 TechnicalSEOBot'
  });

  const results = {
    redirect_tests: [],
    routing_bugs: [],
    parameter_url_checks: [],
    noindex_bugs: [],
    font_crawl_issue: false,
    lol_page_bug: false,
    critical_issues: [],
    all_clear: true
  };

  // Helper to open page safely
  async function testPage(url, timeoutMs = 15000) {
    const page = await context.newPage();
    let response = null;
    let redirectChain = [];
    let error = null;

    try {
      response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
      
      let req = response ? response.request() : null;
      while (req && req.redirectedFrom()) {
        const prevReq = req.redirectedFrom();
        const prevRes = await prevReq.response();
        redirectChain.unshift({
          url: prevReq.url(),
          status: prevRes ? prevRes.status() : null,
          location: prevRes ? (prevRes.headers()['location'] || '') : ''
        });
        req = prevReq;
      }
    } catch (e) {
      error = e.message;
    }
    return { page, response, redirectChain, error };
  }

  console.log("\n--- 1. REDIRECT TESTS ---");
  const redirectUrls = [
    { url: "http://nubixshop.ir/", expected: "https://nubixshop.ir/", type: "exact_target" },
    { url: "https://nubixshop.ir/index.php", expected: "https://nubixshop.ir/", type: "exact_target" },
    { url: "https://nubixshop.ir/product/fortnite-crew-pack", expected: "https://nubixshop.ir/crewpack", type: "exact_target" },
    { url: "http://nubixshop.ir/vbucks", expected: "https://nubixshop.ir/vbucks", type: "exact_target" },
    { url: "http://nubixshop.ir/product/chatgpt-subscription", expected: "https://nubixshop.ir/product/chatgpt-subscription", type: "https_upgrade" },
    { url: "http://nubixshop.ir/product/fortnite-battle-pass", expected: "https://nubixshop.ir/product/fortnite-battle-pass", type: "https_upgrade" },
    { url: "http://nubixshop.ir/crewpack", expected: "https://nubixshop.ir/crewpack", type: "https_upgrade" },
    { url: "http://nubixshop.ir/lego", expected: "https://nubixshop.ir/lego", type: "https_upgrade" },
    { url: "http://nubixshop.ir/gta6", expected: "https://nubixshop.ir/gta6", type: "https_upgrade" },
    { url: "https://nubixshop.ir/help", expected: "301 or live page", type: "verify" },
    { url: "https://nubixshop.ir/guide", expected: "301 to /guides or live", type: "verify" },
    { url: "https://ai.nubixshop.ir/", expected: "verify status & content", type: "verify" }
  ];

  for (const item of redirectUrls) {
    console.log(`Testing redirect: ${item.url}`);
    const { page, response, redirectChain, error } = await testPage(item.url);
    
    let isPass = false;
    let actualStr = "";

    if (error) {
      actualStr = `Timeout/Error: ${error}`;
      isPass = false;
    } else {
      const finalUrl = page ? page.url() : "";
      const finalStatus = response ? response.status() : 0;
      const initialStep = redirectChain.length > 0 ? redirectChain[0] : null;

      if (initialStep) {
        actualStr = `Status ${initialStep.status} (Location: ${initialStep.location}) → Final: ${finalUrl} (Status ${finalStatus})`;
        
        if (item.type === "exact_target") {
          const targetUrl = new URL(item.expected, "https://nubixshop.ir").href;
          const endedUrl = new URL(finalUrl, "https://nubixshop.ir").href;
          isPass = (initialStep.status === 301 || initialStep.status === 308) && endedUrl === targetUrl;
        } else if (item.type === "https_upgrade") {
          isPass = (initialStep.status === 301 || initialStep.status === 308) && finalUrl.startsWith("https://");
        } else { // verify
          isPass = true;
        }
      } else {
        actualStr = `Direct Status ${finalStatus} (No redirect) → ${finalUrl}`;
        if (item.type === "verify") {
          isPass = true;
        } else {
          isPass = false; // Expected redirect but got direct load
        }
      }
    }

    results.redirect_tests.push({
      url: item.url,
      expected: item.expected,
      actual: actualStr,
      pass: isPass
    });

    if (!isPass && item.type !== "verify") {
      results.critical_issues.push(`Redirect failed for ${item.url}: Expected ${item.expected}, got [${actualStr}]`);
      results.all_clear = false;
    }

    if (page) await page.close();
    await sleep(3000);
  }

  console.log("\n--- 2. ROUTING BUGS (MUST BE 404) ---");
  const routingUrls = [
    "https://nubixshop.ir/product/[slug]",
    "https://nubixshop.ir/blog/category/[slug]",
    "https://nubixshop.ir/product/nonexistent-xyz-123"
  ];

  for (const url of routingUrls) {
    console.log(`Testing routing bug: ${url}`);
    const { page, response, error } = await testPage(url);
    const status = response ? response.status() : (error ? 0 : 0);
    const isPass = status === 404;

    results.routing_bugs.push({
      url: url,
      expected_status: 404,
      actual_status: status,
      pass: isPass
    });

    if (!isPass) {
      results.critical_issues.push(`Routing bug at ${url}: Expected status 404, actual status ${status}`);
      results.all_clear = false;
    }

    if (page) await page.close();
    await sleep(3000);
  }

  console.log("\n--- 3. PARAMETER URL CHECKS ---");
  const paramUrls = [
    { url: "https://nubixshop.ir/?q=test", expectedType: "noindex" },
    { url: "https://nubixshop.ir/?cat=" + encodeURIComponent("فورتنایت"), expectedType: "canonical" },
    { url: "https://nubixshop.ir/?cat=" + encodeURIComponent("گیفت کارتها"), expectedType: "canonical" },
    { url: "https://nubixshop.ir/?cat=" + encodeURIComponent("اشتراکها"), expectedType: "canonical" }
  ];

  for (const item of paramUrls) {
    console.log(`Testing parameter URL: ${item.url}`);
    const { page, response, error } = await testPage(item.url);

    let hasNoindex = false;
    let hasCanonical = false;
    let canonicalTarget = "";

    if (page && !error) {
      const robotsContent = await page.$eval('meta[name="robots"]', el => el.getAttribute('content')).catch(() => null);
      if (robotsContent && robotsContent.toLowerCase().includes('noindex')) {
        hasNoindex = true;
      }

      const canonicalHref = await page.$eval('link[rel="canonical"]', el => el.getAttribute('href')).catch(() => null);
      if (canonicalHref) {
        hasCanonical = true;
        canonicalTarget = canonicalHref;
      }
    }

    let isPass = false;
    if (item.expectedType === "noindex") {
      isPass = hasNoindex || (hasCanonical && !canonicalTarget.includes('?q='));
    } else {
      isPass = hasCanonical && canonicalTarget !== "";
    }

    results.parameter_url_checks.push({
      url: item.url,
      has_noindex: hasNoindex,
      has_canonical: hasCanonical,
      canonical_target: canonicalTarget,
      pass: isPass
    });

    if (!isPass) {
      results.critical_issues.push(`Parameter URL check failed for ${item.url}: noindex=${hasNoindex}, canonical=${canonicalTarget}`);
      results.all_clear = false;
    }

    if (page) await page.close();
    await sleep(3000);
  }

  console.log("\n--- 4. NOINDEX CHECK ON REVENUE PAGES ---");
  const revenuePages = [
    "/product/chatgpt-subscription",
    "/product/gemini-subscription",
    "/product/league-of-legends-rp",
    "/product/fortnite-music-pass",
    "/product/perfected-nature",
    "/product/frozen-legends",
    "/vbucks",
    "/crewpack",
    "/product/fortnite-battle-pass",
    "/lego",
    "/gta6"
  ];

  for (const path of revenuePages) {
    const fullUrl = `https://nubixshop.ir${path}`;
    console.log(`Testing revenue page indexing: ${fullUrl}`);
    const { page, response, error } = await testPage(fullUrl);

    let metaRobots = "index,follow (default - meta absent)";
    if (page && !error) {
      const robotsContent = await page.$eval('meta[name="robots"]', el => el.getAttribute('content')).catch(() => null);
      if (robotsContent) {
        metaRobots = robotsContent;
      }
    }

    const isPass = !metaRobots.toLowerCase().includes('noindex');

    results.noindex_bugs.push({
      url: path,
      meta_robots: metaRobots,
      should_be: "index,follow",
      pass: isPass
    });

    if (!isPass) {
      results.critical_issues.push(`Revenue page ${path} is blocked by NOINDEX! (${metaRobots})`);
      results.all_clear = false;
    }

    if (page) await page.close();
    await sleep(3000);
  }

  console.log("\n--- 5. FONT FILES & ROBOTS.TXT CHECK ---");
  {
    console.log("Testing robots.txt for /fonts/ block...");
    const { page, response, error } = await testPage("https://nubixshop.ir/robots.txt");
    let robotsContent = "";
    if (page && !error) {
      robotsContent = await page.evaluate(() => document.body.innerText).catch(() => "");
    }

    const blocksFonts = robotsContent.includes("Disallow: /fonts/") || robotsContent.includes("Disallow: /fonts");
    results.font_crawl_issue = !blocksFonts;

    if (results.font_crawl_issue) {
      results.critical_issues.push("robots.txt does NOT block /fonts/ directory. Font files may be crawled as pages.");
      results.all_clear = false;
    }

    if (page) await page.close();
    await sleep(3000);
  }

  console.log("\n--- 6. /lol BUG CHECK ---");
  {
    console.log("Testing /lol page content...");
    const { page, response, error } = await testPage("https://nubixshop.ir/lol");
    if (page && !error) {
      const title = await page.title();
      const pageHtml = await page.content();
      const h1Text = await page.$eval('h1', el => el.innerText).catch(() => "");

      console.log(`/lol title: "${title}", h1: "${h1Text}"`);

      // Check if /lol shows League of Legends category content or homepage clone
      const hasLolKeywords = pageHtml.includes("League of Legends") || 
                             pageHtml.includes("لیگ آف لجندز") || 
                             pageHtml.includes("آر پی") ||
                             pageHtml.includes("RP");
      
      const isHomepageClone = !hasLolKeywords || (h1Text === "" && title.includes("نوبیکس شاپ") && !title.includes("لیگ"));
      
      results.lol_page_bug = isHomepageClone;
      if (isHomepageClone) {
        results.critical_issues.push("/lol page shows homepage clone instead of League of Legends category content.");
        results.all_clear = false;
      }
    } else {
      results.critical_issues.push(`/lol page failed to load: ${error}`);
      results.all_clear = false;
    }

    if (page) await page.close();
  }

  console.log("\n==========================================");
  console.log("TECHNICAL SEO AUDIT COMPLETED");
  console.log("==========================================");

  fs.writeFileSync('./seo_test_results.json', JSON.stringify(results, null, 2));
  await browser.close();
})();
