1:"$Sreact.fragment"
2:"$Sreact.suspense"
3:I[95401,["/_next/static/chunks/1yjlfi26-asr5.js","/_next/static/chunks/233fjiur5ldux.js","/_next/static/chunks/301gc0aac1lq1.js","/_next/static/chunks/1bg98nj7gzxup.js","/_next/static/chunks/3trx1w2h0pb7b.js"],"default"]
9:I[5500,["/_next/static/chunks/1yjlfi26-asr5.js","/_next/static/chunks/233fjiur5ldux.js","/_next/static/chunks/301gc0aac1lq1.js","/_next/static/chunks/1bg98nj7gzxup.js","/_next/static/chunks/3trx1w2h0pb7b.js"],"Image"]
a:I[22016,["/_next/static/chunks/1yjlfi26-asr5.js","/_next/static/chunks/233fjiur5ldux.js","/_next/static/chunks/301gc0aac1lq1.js","/_next/static/chunks/1bg98nj7gzxup.js","/_next/static/chunks/3trx1w2h0pb7b.js"],""]
d:I[97367,["/_next/static/chunks/1yjlfi26-asr5.js","/_next/static/chunks/233fjiur5ldux.js","/_next/static/chunks/301gc0aac1lq1.js"],"OutletBoundary"]
17:I[78381,["/_next/static/chunks/1yjlfi26-asr5.js","/_next/static/chunks/233fjiur5ldux.js","/_next/static/chunks/301gc0aac1lq1.js","/_next/static/chunks/1bg98nj7gzxup.js","/_next/static/chunks/3trx1w2h0pb7b.js"],"default"]
:HL["https://trustseal.enamad.ir/logo.aspx?id=671892&Code=BvHIZx1aeWqVhIlNuGSIySWJ49Yd2uE2","image",{"referrerPolicy":"origin"}]
4:T2675,
          .faq-page-wrapper {
            min-height: 100vh;
            background: var(--bg);
            color: var(--text);
            padding: 120px 16px 80px;
            font-family: inherit;
            transition: background 0.3s ease;
          }
          .faq-container {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            gap: 32px;
          }
          .faq-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 24px;
            border-radius: 24px;
            padding: 32px 40px;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01));
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid var(--line);
            box-shadow: var(--shadow);
            position: relative;
            overflow: hidden;
          }
          .faq-header::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; height: 4px;
            background: linear-gradient(90deg, var(--primary), var(--primary-2), var(--accent));
          }
          .faq-header-content {
            display: flex;
            gap: 24px;
            align-items: center;
            flex-wrap: wrap;
            z-index: 1;
          }
          .faq-logo-wrapper {
            background: rgba(255,255,255,0.05);
            border-radius: 20px;
            padding: 10px;
            border: 1px solid var(--line);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .faq-header-text h1 {
            margin: 4px 0 8px;
            font-size: 32px;
            font-weight: 900;
            color: var(--text);
            letter-spacing: -0.5px;
          }
          .faq-header-text p {
            margin: 0;
            color: var(--muted);
            font-size: 15px;
            line-height: 1.6;
            max-width: 600px;
          }
          .faq-status-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(34, 197, 94, 0.1);
            color: #10b981;
            padding: 6px 14px;
            border-radius: 99px;
            font-size: 13px;
            font-weight: 700;
            border: 1px solid rgba(34, 197, 94, 0.2);
            animation: pulse 2s infinite;
          }
          .faq-status-dot {
            width: 8px;
            height: 8px;
            background: #10b981;
            border-radius: 50%;
          }
          
          /* Two Column Layout */
          .faq-body-grid {
            display: grid;
            grid-template-columns: 320px 1fr;
            gap: 32px;
            align-items: start;
          }
          
          .faq-sidebar {
            position: sticky;
            top: 100px;
            display: flex;
            flex-direction: column;
            gap: 24px;
          }
          
          .faq-nav {
            display: flex;
            flex-direction: column;
            gap: 18px;
            background: var(--card);
            padding: 16px;
            border-radius: 24px;
            border: 1px solid var(--line);
            box-shadow: var(--shadow);
          }
          .faq-nav-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .faq-nav-group-title {
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.5px;
            color: var(--muted);
            opacity: 0.7;
            padding: 0 8px 4px;
            text-transform: none;
          }

          .faq-nav-link {
            display: flex;
            align-items: center;
            padding: 12px 18px;
            border-radius: 14px;
            background: transparent;
            border: 1px solid transparent;
            color: var(--muted);
            text-decoration: none;
            font-size: 14px;
            font-weight: 700;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .faq-nav-link:hover {
            background: rgba(124, 58, 237, 0.04);
            color: var(--primary);
            padding-right: 22px;
          }
          
          .faq-nav-link.active {
            background: linear-gradient(135deg, var(--primary), var(--primary-2));
            border-color: var(--primary);
            color: #fff;
            box-shadow: 0 8px 20px rgba(124, 58, 237, 0.25);
          }
          
          .faq-back-home {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 14px 20px;
            border-radius: 16px;
            background: var(--text);
            color: var(--bg);
            text-decoration: none;
            font-weight: 800;
            font-size: 14px;
            transition: all 0.2s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            text-align: center;
          }
          
          .faq-back-home:hover {
            opacity: 0.95;
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0,0,0,0.1);
          }
          
          .faq-trust-card {
            background: var(--card);
            border-radius: 24px;
            padding: 24px;
            border: 1px solid var(--line);
            box-shadow: var(--shadow);
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .faq-popular-card {
            background: var(--card);
            border-radius: 24px;
            padding: 24px;
            border: 1px solid var(--line);
            box-shadow: var(--shadow);
          }
          .faq-popular-links {
            list-style: none;
            margin: 12px 0 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .faq-popular-links a {
            color: var(--muted);
            font-size: 13.5px;
            font-weight: 700;
            text-decoration: none;
            transition: color 0.2s;
          }
          .faq-popular-links a:hover {
            color: var(--primary);
          }
          
          .faq-trust-title {
            font-size: 14px;
            font-weight: 800;
            color: var(--text);
            margin: 0;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--line);
          }
          
          .faq-trust-logos {
            display: flex;
            gap: 12px;
            align-items: center;
            justify-content: space-between;
          }
          
          .faq-trust-logo {
            border-radius: 12px;
            background: var(--bg);
            padding: 8px;
            border: 1px solid var(--line);
            transition: all 0.25s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 1;
            height: 60px;
          }
          
          .faq-trust-logo:hover {
            transform: translateY(-3px) scale(1.02);
            border-color: var(--primary);
            box-shadow: 0 6px 15px rgba(0,0,0,0.05);
          }
          
          .faq-trust-note {
            font-size: 12px;
            color: var(--muted);
            line-height: 1.6;
            margin: 0;
          }

          .faq-main-content {
            animation: fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
            70% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
            100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
          }

          @media (max-width: 992px) {
            .faq-page-wrapper {
              padding-top: 100px;
            }
            .faq-header {
              flex-direction: column;
              align-items: flex-start;
              padding: 24px;
              gap: 16px;
            }
            .faq-header-content {
              gap: 16px;
            }
            .faq-header-text h1 {
              font-size: 26px;
            }
            .faq-body-grid {
              grid-template-columns: 1fr;
              gap: 24px;
            }
            .faq-sidebar {
              position: static;
              gap: 16px;
            }
            .faq-nav {
              flex-direction: column;
              padding: 12px;
              border-radius: 16px;
              gap: 14px;
            }
            .faq-nav-group {
              flex-direction: row;
              overflow-x: auto;
              gap: 8px;
              white-space: nowrap;
              scrollbar-width: none; /* Firefox */
              align-items: center;
            }
            .faq-nav-group::-webkit-scrollbar {
              display: none; /* Chrome/Safari */
            }
            .faq-nav-group-title {
              flex-shrink: 0;
              padding: 0 4px 0 0;
              border-left: 1px solid var(--line);
              padding-left: 10px;
            }
            .faq-nav-link {
              flex-shrink: 0;
              padding: 10px 16px;
              font-size: 13px;
            }
            .faq-nav-link:hover {
              padding-right: 16px;
            }
            .faq-trust-card {
              display: none; /* Hide trust details card in sidebar on mobile */
            }
          }
        0:{"rsc":["$","$1","c",{"children":[[["$","$2",null,{"fallback":null,"children":["$","$L3",null,{}]}],["$","div",null,{"className":"faq-page-wrapper","children":[["$","style",null,{"children":"$4"}],"$L5"]}]],["$L6","$L7"],"$L8"]}],"isPartial":false,"staleTime":300,"varyParams":null,"buildId":"EeDG4MqpMiSzOM9lyUeX3"}
5:["$","div",null,{"className":"faq-container","children":[["$","header",null,{"className":"faq-header","children":["$","div",null,{"className":"faq-header-content","children":[["$","div",null,{"className":"faq-logo-wrapper","children":["$","$L9",null,{"src":"/web_logo.webp","width":64,"height":64,"alt":"لوگوی نوبیکس","priority":true,"quality":95,"unoptimized":true}]}],["$","div",null,{"className":"faq-header-text","children":[["$","div",null,{"style":{"display":"flex","alignItems":"center","gap":"12px","flexWrap":"wrap"},"children":[["$","span",null,{"style":{"margin":0,"fontSize":13,"fontWeight":800,"letterSpacing":1,"textTransform":"uppercase","color":"var(--primary)"},"children":"Nubix Support Center"}],["$","div",null,{"className":"faq-status-badge","children":[["$","span",null,{"className":"faq-status-dot"}],"مرکز پشتیبانی فعال است"]}]]}],["$","h1",null,{"children":"درباره نوبیکس"}],["$","p",null,{"children":"داستان ما، ارزش‌هایی که به آن پایبندیم و مسیری که ما را به نوبیکس امروز رساند."}]]}]]}]}],["$","div",null,{"className":"faq-body-grid","children":[["$","aside",null,{"className":"faq-sidebar","children":[["$","nav",null,{"className":"faq-nav","children":[["$","div","راهنما و پشتیبانی",{"className":"faq-nav-group","children":[["$","span",null,{"className":"faq-nav-group-title","children":"راهنما و پشتیبانی"}],[["$","$La","faq",{"href":"/faq","className":"faq-nav-link ","children":"سوالات متداول"}],["$","$La","about",{"href":"/faq/about","className":"faq-nav-link active","children":"درباره نوبیکس"}],["$","$La","contact",{"href":"/faq/contact","className":"faq-nav-link ","children":"تماس با ما"}],["$","$La","how-to-buy",{"href":"/faq/how-to-buy","className":"faq-nav-link ","children":"راهنمای خرید"}]]]}],["$","div","قوانین و حریم خصوصی",{"className":"faq-nav-group","children":[["$","span",null,{"className":"faq-nav-group-title","children":"قوانین و حریم خصوصی"}],[["$","$La","rules",{"href":"/faq/rules","className":"faq-nav-link ","children":"قوانین و مقررات"}],["$","$La","privacy",{"href":"/faq/privacy","className":"faq-nav-link ","children":"حریم خصوصی"}]]]}],["$","div","راهنمای اکانت",{"className":"faq-nav-group","children":[["$","span",null,{"className":"faq-nav-group-title","children":"راهنمای اکانت"}],[["$","$La","disable-2fa",{"href":"/guides/disable-2fa","className":"faq-nav-link ","children":"خاموش کردن ۲FA"}],["$","$La","link-unlink",{"href":"/guides/link-unlink","className":"faq-nav-link ","children":"لینک و آنلینک اکانت"}],["$","$La","remove-restriction",{"href":"/guides/remove-restriction","className":"faq-nav-link ","children":"رفع محدودیت حساب"}]]]}]]}],["$","div",null,{"className":"faq-popular-card","children":[["$","h3",null,{"className":"faq-trust-title","children":"محصولات پرفروش"}],["$","ul",null,{"className":"faq-popular-links","children":[["$","li",null,{"children":["$","$La",null,{"href":"/vbucks","children":"خرید وی باکس فورتنایت"}]}],["$","li",null,{"children":["$","$La",null,{"href":"/crewpack","children":"خرید کروپک فورتنایت"}]}],["$","li",null,{"children":["$","$La",null,{"href":"/product/chatgpt-subscription","children":"خرید اشتراک ChatGPT"}]}],["$","li",null,{"children":["$","$La",null,{"href":"/gemini","children":"خرید اشتراک Gemini"}]}],["$","li",null,{"children":["$","$La",null,{"href":"/gta6","children":"پیش‌خرید GTA 6"}]}]]}]]}],["$","div",null,{"className":"faq-trust-card","children":[["$","h3",null,{"className":"faq-trust-title","children":"پرداخت امن و قانونی"}],["$","div",null,{"className":"faq-trust-logos","children":[["$","a","نماد اعتماد الکترونیکی نوبیکس",{"href":"https://trustseal.enamad.ir/?id=671892&Code=BvHIZx1aeWqVhIlNuGSIySWJ49Yd2uE2","target":"_blank","referrerPolicy":"origin","className":"faq-trust-logo","children":["$","img",null,{"src":"https://trustseal.enamad.ir/logo.aspx?id=671892&Code=BvHIZx1aeWqVhIlNuGSIySWJ49Yd2uE2","alt":"نماد اعتماد الکترونیکی نوبیکس","style":{"width":45,"height":45,"objectFit":"contain","cursor":"pointer"},"code":"BvHIZx1aeWqVhIlNuGSIySWJ49Yd2uE2","referrerPolicy":"origin"}]}],["$","$La","درگاه پرداخت زرین‌پال",{"href":"https://www.zarinpal.com/trustPage/nubixshop.ir","target":"_blank","rel":"noreferrer","className":"faq-trust-logo","children":["$","$L9",null,{"src":"/icons/ZarinPal.svg","width":120,"height":40,"style":{"objectFit":"contain"},"alt":"درگاه پرداخت زرین‌پال"}]}]]}],["$","p",null,{"className":"faq-trust-note","children":"تمامی تراکنش‌ها در بستر درگاه بانکی رسمی و معتبر انجام پذیرفته و سفارشات گیمینگ از طریق حساب‌های قانونی خارج از کشور تحویل می‌گردند."}]]}],["$","$La",null,{"href":"/","className":"faq-back-home","children":["$Lb","بازگشت به فروشگاه"]}]]}],"$Lc"]}]]}]
6:["$","script","script-0",{"src":"/_next/static/chunks/1bg98nj7gzxup.js","async":true}]
7:["$","script","script-1",{"src":"/_next/static/chunks/3trx1w2h0pb7b.js","async":true}]
8:["$","$Ld",null,{"children":["$","$2",null,{"name":"Next.MetadataOutlet","children":"$@e"}]}]
b:["$","svg",null,{"width":"18","height":"18","viewBox":"0 0 24 24","fill":"none","stroke":"currentColor","strokeWidth":"2.5","strokeLinecap":"round","strokeLinejoin":"round","children":[["$","path",null,{"d":"M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"}],["$","polyline",null,{"points":"9 22 9 12 15 12 15 22"}]]}]
f:T202b,
          .about-container {
            display: flex;
            flex-direction: column;
            gap: 24px;
            width: 100%;
          }
          .about-box {
            background: var(--card);
            border: 1px solid var(--line);
            border-radius: 24px;
            overflow: hidden;
            box-shadow: var(--shadow);
          }
          .about-banner {
            position: relative;
            padding: 48px 40px;
            background: linear-gradient(135deg, #7c3aed, #4f46e5 55%, #0088cc);
            overflow: hidden;
          }
          .about-banner::before {
            content: '';
            position: absolute;
            inset: 0;
            background: radial-gradient(circle at 85% 15%, rgba(255,255,255,0.18) 0%, transparent 55%);
            pointer-events: none;
          }
          .about-banner-icon {
            position: absolute;
            top: 16px;
            left: 24px;
            font-size: 92px;
            opacity: 0.14;
            user-select: none;
          }
          .about-banner-tag {
            display: inline-block;
            font-size: 12px;
            font-weight: 800;
            color: #fff;
            background: rgba(255,255,255,0.2);
            padding: 5px 14px;
            border-radius: 99px;
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            position: relative;
            z-index: 1;
          }
          .about-banner h2 {
            margin: 14px 0 8px;
            font-size: 30px;
            font-weight: 900;
            color: #fff;
            position: relative;
            z-index: 1;
            text-shadow: 0 2px 6px rgba(0,0,0,0.15);
          }
          .about-banner p {
            margin: 0;
            font-size: 15px;
            color: rgba(255,255,255,0.9);
            max-width: 640px;
            line-height: 1.8;
            position: relative;
            z-index: 1;
          }
          .about-content {
            padding: 40px;
            color: var(--text);
            font-size: 16px;
            line-height: 2;
          }
          .about-story p {
            margin: 0 0 18px;
            color: var(--text);
          }
          .about-story a.story-link {
            color: var(--primary);
            font-weight: 800;
            text-decoration: none;
            border-bottom: 2px solid rgba(124, 58, 237, 0.35);
            transition: all 0.2s ease;
          }
          .about-story a.story-link:hover {
            border-bottom-color: var(--primary);
            color: var(--primary-2);
          }
          .about-story strong { color: var(--text); font-weight: 800; }

          .about-stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin: 32px 0;
          }
          .about-stat {
            background: var(--bg);
            border: 1px solid var(--line);
            border-radius: 18px;
            padding: 20px 16px;
            text-align: center;
          }
          .about-stat-value {
            font-size: 24px;
            font-weight: 900;
            background: linear-gradient(135deg, var(--primary), var(--primary-2));
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .about-stat-label {
            display: block;
            margin-top: 6px;
            font-size: 12.5px;
            color: var(--muted);
            font-weight: 700;
          }

          .about-section-title {
            font-size: 19px;
            font-weight: 800;
            color: var(--text);
            margin: 8px 0 22px;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--line);
          }

          .about-timeline {
            position: relative;
            padding-right: 22px;
            margin-bottom: 36px;
          }
          .about-timeline::before {
            content: '';
            position: absolute;
            top: 6px;
            bottom: 6px;
            right: 6px;
            width: 2px;
            background: linear-gradient(var(--primary), transparent);
          }
          .about-tl-item {
            position: relative;
            padding: 0 24px 26px 0;
          }
          .about-tl-item:last-child { padding-bottom: 0; }
          .about-tl-item::before {
            content: '';
            position: absolute;
            right: -21px;
            top: 4px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: var(--primary);
            box-shadow: 0 0 0 4px rgba(124,58,237,0.15);
          }
          .about-tl-year {
            display: inline-block;
            font-size: 12px;
            font-weight: 800;
            color: var(--primary);
            background: rgba(124,58,237,0.08);
            padding: 3px 12px;
            border-radius: 99px;
            margin-bottom: 6px;
          }
          .about-tl-item h4 {
            margin: 0 0 4px;
            font-size: 16px;
            font-weight: 800;
            color: var(--text);
          }
          .about-tl-item p {
            margin: 0;
            font-size: 14px;
            color: var(--muted);
            line-height: 1.8;
          }

          .about-values-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
          .about-value-card {
            background: var(--bg);
            border: 1px solid var(--line);
            border-radius: 18px;
            padding: 22px;
            transition: all 0.25s ease;
          }
          .about-value-card:hover {
            transform: translateY(-3px);
            border-color: var(--primary);
            box-shadow: 0 8px 20px rgba(124,58,237,0.06);
          }
          .about-value-icon { font-size: 28px; }
          .about-value-card h4 {
            margin: 10px 0 6px;
            font-size: 16px;
            font-weight: 800;
            color: var(--text);
          }
          .about-value-card p {
            margin: 0;
            font-size: 13.5px;
            color: var(--muted);
            line-height: 1.8;
          }

          .about-cta {
            margin-top: 34px;
            text-align: center;
            background: linear-gradient(135deg, rgba(124,58,237,0.06), rgba(0,136,204,0.04));
            border: 1px solid var(--line);
            border-radius: 20px;
            padding: 30px;
          }
          .about-cta h3 {
            margin: 0 0 8px;
            font-size: 18px;
            font-weight: 900;
            color: var(--text);
          }
          .about-cta p {
            margin: 0 0 18px;
            font-size: 14px;
            color: var(--muted);
          }
          .about-cta-btns {
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
          }
          .about-cta-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 13px 26px;
            border-radius: 14px;
            font-size: 14px;
            font-weight: 800;
            text-decoration: none;
            transition: all 0.25s ease;
          }
          .about-cta-btn.primary {
            background: linear-gradient(135deg, var(--primary), var(--primary-2));
            color: #fff;
            box-shadow: 0 8px 22px rgba(124,58,237,0.25);
          }
          .about-cta-btn.primary:hover { transform: translateY(-2px); }
          .about-cta-btn.ghost {
            background: var(--card);
            color: var(--text);
            border: 1px solid var(--line);
          }
          .about-cta-btn.ghost:hover { border-color: var(--primary); color: var(--primary); }

          @media (max-width: 768px) {
            .about-banner { padding: 32px 24px; }
            .about-banner h2 { font-size: 24px; }
            .about-content { padding: 24px; }
            .about-stats { grid-template-columns: 1fr 1fr; }
            .about-values-grid { grid-template-columns: 1fr; }
          }
        c:["$","main",null,{"className":"faq-main-content","children":["$","div",null,{"className":"about-container","children":[["$","style",null,{"children":"$f"}],"$L10","$L11"]}]}]
e:null
10:["$","div",null,{"className":"about-box","children":[["$","div",null,{"className":"about-banner","children":[["$","span",null,{"className":"about-banner-icon","children":"🚀"}],["$","span",null,{"className":"about-banner-tag","children":"داستان ما"}],["$","h2",null,{"children":"ما نوبیکس هستیم؛ ساخته‌شده با علاقه به گیم"}],["$","p",null,{"children":"راهی امن، قانونی و انسانی برای خرید محصولات گیمینگ و اشتراک‌های بین‌المللی؛ همان چیزی که سال‌ها پیش آرزویش را داشتیم و امروز آن را برای شما ساخته‌ایم."}]]}],["$","div",null,{"className":"about-content","children":[["$","div",null,{"className":"about-story","children":[["$","p",null,{"children":["داستان نوبیکس از یک دغدغه‌ی ساده شروع شد. حدود"," ",["$","$La",null,{"href":"https://www.zarinpal.com/trustPage/nubixshop.ir","target":"_blank","rel":"noreferrer","className":"story-link","children":"سال ۱۳۹۷"}]," ","بود که تیم ما فکر راه‌اندازی یک فروشگاه آنلاین را در سر داشت؛ جمعی از گیمرها که هر روز با یک مشکل مشترک روبه‌رو بودند: خرید محصولات درون‌بازی و اشتراک‌های خارجی در ایران نه ساده بود، نه امن. تحریم‌ها، نبود کارت‌های اعتباری بین‌المللی و فروشگاه‌های واسطِ بی‌اعتبار، تجربه‌ی خرید را برای هر گیمر ایرانی به کابوسی همراه با نگرانی تبدیل کرده بود."]}],["$","p",null,{"children":["ما تصمیم گرفتیم این تجربه را از پایه تغییر دهیم. به‌جای وعده‌های بزرگ، روی چیزهایی سرمایه‌گذاری کردیم که واقعاً اهمیت دارند: ",["$","strong",null,{"children":"صداقت"}],"،",["$","strong",null,{"children":" خرید کاملاً قانونی"}]," و ",["$","strong",null,{"children":"پشتیبانی واقعی و انسانی"}],". اولین سفارش‌ها با وسواس تمام انجام شد و همان روزها فهمیدیم که اعتماد، تنها سرمایه‌ای است که ارزش ساختن دارد."]}],["$","p",null,{"children":"در ادامه‌ی مسیر، زیرساخت را قانونی و شفاف کردیم؛ نماد اعتماد الکترونیکی را دریافت کردیم، پرداخت‌ها را به درگاه رسمی و امن زرین‌پال سپردیم و برای انجام بدون خطای سفارش‌ها، شعبه‌ای رسمی در ازمیر ترکیه راه‌اندازی کردیم. امروز نوبیکس با پشتیبانی هوشمند، پنل همکاری فروش و هزاران سفارش موفق، همان رؤیای سال ۱۳۹۷ است که بزرگ شده — اما هنوز به همان اصل اول وفادار مانده: کنار شما بودن تا آخرین لحظه."}]]}],["$","div",null,{"className":"about-stats","children":[["$","div","سال تجربه",{"className":"about-stat","children":[["$","span",null,{"className":"about-stat-value","children":"+۶"}],["$","span",null,{"className":"about-stat-label","children":"سال تجربه"}]]}],["$","div","سفارش موفق",{"className":"about-stat","children":[["$","span",null,{"className":"about-stat-value","children":"+۱۰٬۰۰۰"}],["$","span",null,{"className":"about-stat-label","children":"سفارش موفق"}]]}],["$","div","دفتر رسمی (تهران و ازمیر)",{"className":"about-stat","children":[["$","span",null,{"className":"about-stat-value","children":"۲"}],["$","span",null,{"className":"about-stat-label","children":"دفتر رسمی (تهران و ازمیر)"}]]}],["$","div","پشتیبانی تلگرام",{"className":"about-stat","children":[["$","span",null,{"className":"about-stat-value","children":"۲۴/۷"}],["$","span",null,{"className":"about-stat-label","children":"پشتیبانی تلگرام"}]]}]]}],["$","h3",null,{"className":"about-section-title","children":"مسیری که آمده‌ایم"}],["$","div",null,{"className":"about-timeline","children":[["$","div","۱۳۹۷",{"className":"about-tl-item","children":[["$","span",null,{"className":"about-tl-year","children":"۱۳۹۷"}],["$","h4",null,{"children":"جرقه یک ایده"}],["$","p",null,{"children":"همه‌چیز با علاقه‌ی چند گیمر به دنیای بازی آغاز شد؛ جایی که تصمیم گرفتیم راهی امن و قانونی برای خرید محصولات گیمینگ در ایران بسازیم."}]]}],["$","div","۱۳۹۸",{"className":"about-tl-item","children":[["$","span",null,{"className":"about-tl-year","children":"۱۳۹۸"}],["$","h4",null,{"children":"اولین سفارش‌ها"}],["$","p",null,{"children":"با تمرکز بر صداقت و پاسخگویی، اعتماد نخستین مشتریان را جلب کردیم و پایه‌های یک برند ماندگار را بنا نهادیم."}]]}],["$","div","۱۴۰۰",{"className":"about-tl-item","children":[["$","span",null,{"className":"about-tl-year","children":"۱۴۰۰"}],["$","h4",null,{"children":"زیرساخت قانونی"}],["$","p",null,{"children":"با دریافت نماد اعتماد الکترونیکی و راه‌اندازی درگاه رسمی زرین‌پال، خرید در نوبیکس کاملاً شفاف و تضمین‌شده شد."}]]}],"$L12","$L13"]}],"$L14","$L15","$L16"]}]]}]
11:["$","$L17",null,{}]
12:["$","div","۱۴۰۲",{"className":"about-tl-item","children":[["$","span",null,{"className":"about-tl-year","children":"۱۴۰۲"}],["$","h4",null,{"children":"گسترش بین‌المللی"}],["$","p",null,{"children":"با تأسیس شعبه‌ی ازمیر ترکیه و استفاده از حساب‌های کاملاً قانونی، فعال‌سازی سفارش‌ها بدون خطا و ریجکت انجام شد."}]]}]
13:["$","div","امروز",{"className":"about-tl-item","children":[["$","span",null,{"className":"about-tl-year","children":"امروز"}],["$","h4",null,{"children":"نسل تازه نوبیکس"}],["$","p",null,{"children":"پشتیبانی هوشمند، پنل همکاری فروش (B2B) و صدها سفارش موفق روزانه؛ نوبیکس امروز فراتر از یک فروشگاه، یک تجربه‌ی مطمئن است."}]]}]
14:["$","h3",null,{"className":"about-section-title","children":"ارزش‌های ما"}]
15:["$","div",null,{"className":"about-values-grid","children":[["$","div","خرید کاملاً قانونی",{"className":"about-value-card","children":[["$","span",null,{"className":"about-value-icon","children":"🛡️"}],["$","h4",null,{"children":"خرید کاملاً قانونی"}],["$","p",null,{"children":"تمام فعال‌سازی‌ها با حساب‌های احراز هویت‌شده و رسمی انجام می‌شود تا امنیت اکانت شما تضمین شود."}]]}],["$","div","سرعت و دقت",{"className":"about-value-card","children":[["$","span",null,{"className":"about-value-icon","children":"⚡"}],["$","h4",null,{"children":"سرعت و دقت"}],["$","p",null,{"children":"سفارش‌ها در کوتاه‌ترین زمان ممکن پردازش و نتیجه با پیامک و ایمیل به شما اطلاع داده می‌شود."}]]}],["$","div","پشتیبانی انسانی",{"className":"about-value-card","children":[["$","span",null,{"className":"about-value-icon","children":"🤝"}],["$","h4",null,{"children":"پشتیبانی انسانی"}],["$","p",null,{"children":"از لحظه ثبت سفارش تا تحویل نهایی، تیم پشتیبانی نوبیکس واقعاً کنار شماست؛ نه یک ربات سرد."}]]}],["$","div","قیمت منصفانه",{"className":"about-value-card","children":[["$","span",null,{"className":"about-value-icon","children":"💎"}],["$","h4",null,{"children":"قیمت منصفانه"}],["$","p",null,{"children":"با حذف واسطه‌ها و خرید مستقیم، محصولات را با کمترین کارمزد ممکن به دست شما می‌رسانیم."}]]}]]}]
16:["$","div",null,{"className":"about-cta","children":[["$","h3",null,{"children":"آماده‌اید تجربه‌ی خرید مطمئن را شروع کنید؟"}],["$","p",null,{"children":"هزاران گیمر ایرانی به نوبیکس اعتماد کرده‌اند؛ حالا نوبت شماست."}],["$","div",null,{"className":"about-cta-btns","children":[["$","$La",null,{"href":"/","className":"about-cta-btn primary","children":"مشاهده محصولات"}],["$","$La",null,{"href":"/faq/contact","className":"about-cta-btn ghost","children":"تماس با ما"}]]}]]}]
