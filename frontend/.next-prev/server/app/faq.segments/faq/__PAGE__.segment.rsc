1:"$Sreact.fragment"
2:"$Sreact.suspense"
3:I[95401,["/_next/static/chunks/1yjlfi26-asr5.js","/_next/static/chunks/233fjiur5ldux.js","/_next/static/chunks/301gc0aac1lq1.js","/_next/static/chunks/34r5zu3rd-75t.js","/_next/static/chunks/3trx1w2h0pb7b.js"],"default"]
9:I[5500,["/_next/static/chunks/1yjlfi26-asr5.js","/_next/static/chunks/233fjiur5ldux.js","/_next/static/chunks/301gc0aac1lq1.js","/_next/static/chunks/34r5zu3rd-75t.js","/_next/static/chunks/3trx1w2h0pb7b.js"],"Image"]
a:I[22016,["/_next/static/chunks/1yjlfi26-asr5.js","/_next/static/chunks/233fjiur5ldux.js","/_next/static/chunks/301gc0aac1lq1.js","/_next/static/chunks/34r5zu3rd-75t.js","/_next/static/chunks/3trx1w2h0pb7b.js"],""]
d:I[97367,["/_next/static/chunks/1yjlfi26-asr5.js","/_next/static/chunks/233fjiur5ldux.js","/_next/static/chunks/301gc0aac1lq1.js"],"OutletBoundary"]
10:I[68432,["/_next/static/chunks/1yjlfi26-asr5.js","/_next/static/chunks/233fjiur5ldux.js","/_next/static/chunks/301gc0aac1lq1.js","/_next/static/chunks/34r5zu3rd-75t.js","/_next/static/chunks/3trx1w2h0pb7b.js"],"default"]
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
5:["$","div",null,{"className":"faq-container","children":[["$","header",null,{"className":"faq-header","children":["$","div",null,{"className":"faq-header-content","children":[["$","div",null,{"className":"faq-logo-wrapper","children":["$","$L9",null,{"src":"/web_logo.webp","width":64,"height":64,"alt":"لوگوی نوبیکس","priority":true,"quality":95,"unoptimized":true}]}],["$","div",null,{"className":"faq-header-text","children":[["$","div",null,{"style":{"display":"flex","alignItems":"center","gap":"12px","flexWrap":"wrap"},"children":[["$","span",null,{"style":{"margin":0,"fontSize":13,"fontWeight":800,"letterSpacing":1,"textTransform":"uppercase","color":"var(--primary)"},"children":"Nubix Support Center"}],["$","div",null,{"className":"faq-status-badge","children":[["$","span",null,{"className":"faq-status-dot"}],"مرکز پشتیبانی فعال است"]}]]}],["$","h1",null,{"children":"سوالات متداول"}],["$","p",null,{"children":"پاسخ جامع به پرتکرارترین پرسش‌های کاربران نوبیکس شاپ؛ شفافیت در خرید و پشتیبانی."}]]}]]}]}],["$","div",null,{"className":"faq-body-grid","children":[["$","aside",null,{"className":"faq-sidebar","children":[["$","nav",null,{"className":"faq-nav","children":[["$","div","راهنما و پشتیبانی",{"className":"faq-nav-group","children":[["$","span",null,{"className":"faq-nav-group-title","children":"راهنما و پشتیبانی"}],[["$","$La","faq",{"href":"/faq","className":"faq-nav-link active","children":"سوالات متداول"}],["$","$La","about",{"href":"/faq/about","className":"faq-nav-link ","children":"درباره نوبیکس"}],["$","$La","contact",{"href":"/faq/contact","className":"faq-nav-link ","children":"تماس با ما"}],["$","$La","how-to-buy",{"href":"/faq/how-to-buy","className":"faq-nav-link ","children":"راهنمای خرید"}]]]}],["$","div","قوانین و حریم خصوصی",{"className":"faq-nav-group","children":[["$","span",null,{"className":"faq-nav-group-title","children":"قوانین و حریم خصوصی"}],[["$","$La","rules",{"href":"/faq/rules","className":"faq-nav-link ","children":"قوانین و مقررات"}],["$","$La","privacy",{"href":"/faq/privacy","className":"faq-nav-link ","children":"حریم خصوصی"}]]]}],["$","div","راهنمای اکانت",{"className":"faq-nav-group","children":[["$","span",null,{"className":"faq-nav-group-title","children":"راهنمای اکانت"}],[["$","$La","disable-2fa",{"href":"/guides/disable-2fa","className":"faq-nav-link ","children":"خاموش کردن ۲FA"}],["$","$La","link-unlink",{"href":"/guides/link-unlink","className":"faq-nav-link ","children":"لینک و آنلینک اکانت"}],["$","$La","remove-restriction",{"href":"/guides/remove-restriction","className":"faq-nav-link ","children":"رفع محدودیت حساب"}]]]}]]}],["$","div",null,{"className":"faq-popular-card","children":[["$","h3",null,{"className":"faq-trust-title","children":"محصولات پرفروش"}],["$","ul",null,{"className":"faq-popular-links","children":[["$","li",null,{"children":["$","$La",null,{"href":"/vbucks","children":"خرید وی باکس فورتنایت"}]}],["$","li",null,{"children":["$","$La",null,{"href":"/crewpack","children":"خرید کروپک فورتنایت"}]}],["$","li",null,{"children":["$","$La",null,{"href":"/product/chatgpt-subscription","children":"خرید اشتراک ChatGPT"}]}],["$","li",null,{"children":["$","$La",null,{"href":"/gemini","children":"خرید اشتراک Gemini"}]}],["$","li",null,{"children":["$","$La",null,{"href":"/gta6","children":"پیش‌خرید GTA 6"}]}]]}]]}],["$","div",null,{"className":"faq-trust-card","children":[["$","h3",null,{"className":"faq-trust-title","children":"پرداخت امن و قانونی"}],["$","div",null,{"className":"faq-trust-logos","children":[["$","a","نماد اعتماد الکترونیکی نوبیکس",{"href":"https://trustseal.enamad.ir/?id=671892&Code=BvHIZx1aeWqVhIlNuGSIySWJ49Yd2uE2","target":"_blank","referrerPolicy":"origin","className":"faq-trust-logo","children":["$","img",null,{"src":"https://trustseal.enamad.ir/logo.aspx?id=671892&Code=BvHIZx1aeWqVhIlNuGSIySWJ49Yd2uE2","alt":"نماد اعتماد الکترونیکی نوبیکس","style":{"width":45,"height":45,"objectFit":"contain","cursor":"pointer"},"code":"BvHIZx1aeWqVhIlNuGSIySWJ49Yd2uE2","referrerPolicy":"origin"}]}],["$","$La","درگاه پرداخت زرین‌پال",{"href":"https://www.zarinpal.com/trustPage/nubixshop.ir","target":"_blank","rel":"noreferrer","className":"faq-trust-logo","children":["$","$L9",null,{"src":"/icons/ZarinPal.svg","width":120,"height":40,"style":{"objectFit":"contain"},"alt":"درگاه پرداخت زرین‌پال"}]}]]}],["$","p",null,{"className":"faq-trust-note","children":"تمامی تراکنش‌ها در بستر درگاه بانکی رسمی و معتبر انجام پذیرفته و سفارشات گیمینگ از طریق حساب‌های قانونی خارج از کشور تحویل می‌گردند."}]]}],["$","$La",null,{"href":"/","className":"faq-back-home","children":["$Lb","بازگشت به فروشگاه"]}]]}],"$Lc"]}]]}]
6:["$","script","script-0",{"src":"/_next/static/chunks/34r5zu3rd-75t.js","async":true}]
7:["$","script","script-1",{"src":"/_next/static/chunks/3trx1w2h0pb7b.js","async":true}]
8:["$","$Ld",null,{"children":["$","$2",null,{"name":"Next.MetadataOutlet","children":"$@e"}]}]
b:["$","svg",null,{"width":"18","height":"18","viewBox":"0 0 24 24","fill":"none","stroke":"currentColor","strokeWidth":"2.5","strokeLinecap":"round","strokeLinejoin":"round","children":[["$","path",null,{"d":"M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"}],["$","polyline",null,{"points":"9 22 9 12 15 12 15 22"}]]}]
f:Tcbe,{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"چرا نوبیکس شاپ را انتخاب کنیم؟","acceptedAnswer":{"@type":"Answer","text":"تمامی سفارشات به‌صورت قانونی و با حساب‌های احراز هویت‌شده انجام می‌شود. پرداخت امن از طریق درگاه رسمی زرین‌پال، سابقه طولانی فعالیت و پشتیبانی اختصاصی دلیل اعتماد مشتریان به نوبیکس است."}},{"@type":"Question","name":"سفارشات چگونه تکمیل می‌شوند؟","acceptedAnswer":{"@type":"Answer","text":"پس از ثبت سفارش، فعال‌سازی کاملاً خودکار آغاز می‌شود و نتیجه نهایی به‌وسیله پیامک، ایمیل و پنل کاربری اطلاع‌رسانی خواهد شد."}},{"@type":"Question","name":"چگونه سفارش خود را پیگیری کنم؟","acceptedAnswer":{"@type":"Answer","text":"تنها در صورتی با پشتیبانی تماس بگیرید که از زمان سفارش شما حداقل ۲۴ ساعت گذشته باشد. با کد پیگیری از پشتیبانی تلگرام @Nubixsupport پیگیری کنید؛ از ارسال پیام‌های مکرر خودداری نمایید."}},{"@type":"Question","name":"ساعات کاری پشتیبانی چیست؟","acceptedAnswer":{"@type":"Answer","text":"پشتیبانی تلفنی شنبه تا چهارشنبه ۱۱ تا ۱۶، یکشنبه ۱۳ تا ۱۶ و پشتیبانی تلگرام ۲۴ ساعته پاسخگوی شماست."}},{"@type":"Question","name":"روش پرداخت چگونه است؟","acceptedAnswer":{"@type":"Answer","text":"پرداخت‌ها فقط از طریق درگاه امن زرین‌پال و شبکه شاپرک انجام می‌شود. به‌هیچ‌وجه فروش کارت‌به‌کارت نداریم و اطلاعات کارت در سرور ما ذخیره نمی‌شود."}},{"@type":"Question","name":"آیا می‌توانم به نوبیکس اعتماد کنم؟","acceptedAnswer":{"@type":"Answer","text":"نماد اعتماد الکترونیکی فعال، درگاه زرین‌پال، دفاتر رسمی در تهران و ازمیر، حساب‌های بانکی قانونی و صدها نظر مثبت واقعی اعتبار نوبیکس را تضمین می‌کند."}},{"@type":"Question","name":"چه محصولاتی در نوبیکس موجود است؟","acceptedAnswer":{"@type":"Answer","text":"پک‌های فورتنایت، گیفت کارت‌های متنوع، اشتراک‌های هوش مصنوعی و سرویس‌های گیمینگ به‌صورت لحظه‌ای در سایت به‌روزرسانی می‌شوند."}},{"@type":"Question","name":"چرا برخی کارت‌های مجازی کار نمی‌کنند؟","acceptedAnswer":{"@type":"Answer","text":"به دلیل قوانین ضدپولشویی ترکیه، کارت‌های مجازی مثل Papara یا Ozan برای غیرمقیمین مسدود شده‌اند؛ نوبیکس با حساب‌های قانونی ترکیه هیچ مشکلی در فعال‌سازی ندارد."}}]}c:["$","main",null,{"className":"faq-main-content","children":[["$","script",null,{"type":"application/ld+json","dangerouslySetInnerHTML":{"__html":"$f"}}],["$","$L10",null,{}]]}]
e:null
