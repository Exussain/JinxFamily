(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,6505,e=>{"use strict";let a={"fortnite-freediver":"/products/freediver.webp","fortnite-crew-pack":"/products/crewpack.webp","fortnite-starter-pack":"/products/starterpack.webp","fortnite-battle-pass":"/products/battlepass.webp","fortnite-music-pass":"/products/musicpass.webp","gift-battle-pass":"/products/battlepass.webp","fortnite-save-the-world":"/products/savetheworld.webp","fortnite-glided-elite-pack":"/products/pack_glided_elites.webp","v-bucks":"/products/product_vbucks.webp","lego-starter-pack":"/products/lego_starter_pack.webp","pack-agency-renegades":"/products/pack_agency_renegades.webp","agency-renegades":"/products/pack_agency_renegades.webp","pack-frozen-legends":"/products/pack_frozen_legends.webp","frozen-legends":"/products/pack_frozen_legends.webp","pack-polar-legends":"/products/pack_polar_legends.webp","polar-legends":"/products/pack_polar_legends.webp","spotify-subscription":"/products/spotify.webp","chatgpt-subscription":"/products/chatgpt.webp","gemini-subscription":"/products/gemini.webp","change-region-turkey":"/products/change-region-turkey.webp"};function s(e){return"string"!=typeof e?"":e.replace(/\.(webp|png|jpe?g|svg)$/i,"")}function c(e){if("string"!=typeof e||!e.startsWith("/media/"))return e;let a="".replace(/\/+$/,"");return a?`${a}${e}`:e}e.s(["resolveProductImage",0,function(e={}){let i="string"==typeof e.slug?e.slug.trim().toLowerCase():"",r=i?a[i]:"",t=e.image_url||e.imageUrl||e.image||e.imageSrc||r||"",n=e.image_base||e.imageBase||("string"==typeof t&&t.startsWith("/")?s(t):""),l="string"==typeof t&&t.length>0?c(t):"string"==typeof n&&/\.[a-z0-9]+$/i.test(n)?c(n):"";return{imageBase:"string"==typeof n&&n.length>0&&!/\.[a-z0-9]+$/i.test(n)?n:"string"==typeof l&&l.startsWith("/")?s(l):"",imageSrc:l}}])},42043,e=>{"use strict";var a=e.i(43476),s=e.i(57688);let c=/\.webp(?:[?#].*)?$/i,i=/^(https?:)?\/\//i;e.s(["default",0,function({src:e,alt:r,base:t,fit:n="cover",eager:l=!1}){let b=e||(t?`${t}.webp`:null);if(!b)return null;let f=c.test(b);return i.test(b)?(0,a.jsx)("img",{src:b,alt:r,loading:l?"eager":"lazy",fetchPriority:l?"high":void 0,decoding:"async",style:{width:"100%",height:"100%",objectFit:n},draggable:"false"}):(0,a.jsx)(s.default,{src:b,alt:r,fill:!0,sizes:"(max-width: 640px) 100vw, 33vw",quality:95,unoptimized:f,priority:l,style:{objectFit:n}})}])},78381,e=>{"use strict";var a=e.i(43476),s=e.i(21373),c=e.i(71645);e.s(["default",0,function(){let[e,i]=(0,c.useState)(null);return(0,a.jsxs)("div",{className:"jsx-d68c3f20f7facd4c helpfulness-widget",children:[(0,a.jsx)(s.default,{id:"d68c3f20f7facd4c",children:".helpfulness-widget.jsx-d68c3f20f7facd4c{border:1px dashed var(--line);background:#ffffff05;border-radius:20px;justify-content:space-between;align-items:center;gap:20px;margin-top:40px;padding:24px;transition:all .3s;display:flex}.helpfulness-title.jsx-d68c3f20f7facd4c{color:var(--text);margin:0;font-size:15px;font-weight:800}.helpfulness-buttons.jsx-d68c3f20f7facd4c{gap:12px;display:flex}.help-btn.jsx-d68c3f20f7facd4c{cursor:pointer;background:var(--card);border:1px solid var(--line);color:var(--muted);border-radius:12px;align-items:center;gap:8px;padding:8px 16px;font-family:inherit;font-size:13px;font-weight:700;transition:all .25s;display:flex}.help-btn.jsx-d68c3f20f7facd4c:hover{border-color:var(--primary);color:var(--primary);transform:translateY(-1px)}.help-btn.yes.jsx-d68c3f20f7facd4c:hover{color:#10b981;background:#10b98114;border-color:#10b981}.help-btn.no.jsx-d68c3f20f7facd4c:hover{color:#ef4444;background:#ef444414;border-color:#ef4444}.thank-you-msg.jsx-d68c3f20f7facd4c{color:#10b981;align-items:center;gap:8px;font-size:14px;font-weight:700;animation:.3s forwards slideUp;display:flex}@keyframes slideUp{0%{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}@media (width<=640px){.helpfulness-widget.jsx-d68c3f20f7facd4c{text-align:center;flex-direction:column;align-items:stretch;gap:16px}.helpfulness-buttons.jsx-d68c3f20f7facd4c{justify-content:center}}"}),null===e?(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)("h4",{className:"jsx-d68c3f20f7facd4c helpfulness-title",children:"آیا این مقاله آموزشی مفید بود؟"}),(0,a.jsxs)("div",{className:"jsx-d68c3f20f7facd4c helpfulness-buttons",children:[(0,a.jsxs)("button",{onClick:()=>i("yes"),className:"jsx-d68c3f20f7facd4c help-btn yes",children:[(0,a.jsx)("span",{className:"jsx-d68c3f20f7facd4c",children:"👍"})," بله، مفید بود"]}),(0,a.jsxs)("button",{onClick:()=>i("no"),className:"jsx-d68c3f20f7facd4c help-btn no",children:[(0,a.jsx)("span",{className:"jsx-d68c3f20f7facd4c",children:"👎"})," خیر، کامل نبود"]})]})]}):(0,a.jsxs)("div",{style:{margin:"0 auto"},className:"jsx-d68c3f20f7facd4c thank-you-msg",children:[(0,a.jsx)("span",{className:"jsx-d68c3f20f7facd4c",children:"💖"}),"yes"===e?"خوشحالیم که این مقاله برایتان مفید بوده است! سپاس از بازخورد شما.":"ممنون از بازخورد شما. تلاش می‌کنیم این راهنما را در آینده بهبود ببخشیم."]})]})}])},6731,e=>{"use strict";var a=e.i(43476),s=e.i(57688),c=e.i(22016),i=e.i(95401),r=e.i(71645);let t=[{title:"راهنما و پشتیبانی",items:[{id:"faq",label:"سوالات متداول",href:"/faq"},{id:"about",label:"درباره نوبیکس",href:"/faq/about"},{id:"contact",label:"تماس با ما",href:"/faq/contact"},{id:"how-to-buy",label:"راهنمای خرید",href:"/faq/how-to-buy"}]},{title:"قوانین و حریم خصوصی",items:[{id:"rules",label:"قوانین و مقررات",href:"/faq/rules"},{id:"privacy",label:"حریم خصوصی",href:"/faq/privacy"}]},{title:"راهنمای اکانت",items:[{id:"disable-2fa",label:"خاموش کردن ۲FA",href:"/guides/disable-2fa"},{id:"link-unlink",label:"لینک و آنلینک اکانت",href:"/guides/link-unlink"},{id:"remove-restriction",label:"رفع محدودیت حساب",href:"/guides/remove-restriction"}]}],n=[{href:"https://trustseal.enamad.ir/?id=671892&Code=BvHIZx1aeWqVhIlNuGSIySWJ49Yd2uE2",src:"https://trustseal.enamad.ir/logo.aspx?id=671892&Code=BvHIZx1aeWqVhIlNuGSIySWJ49Yd2uE2",alt:"نماد اعتماد الکترونیکی نوبیکس",width:45,height:45},{href:"https://www.zarinpal.com/trustPage/nubixshop.ir",src:"/icons/ZarinPal.svg",alt:"درگاه پرداخت زرین‌پال",width:120,height:40}];e.s(["default",0,function({title:e,subtitle:l,activeSection:b,children:f}){return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(r.Suspense,{fallback:null,children:(0,a.jsx)(i.default,{})}),(0,a.jsxs)("div",{className:"faq-page-wrapper",children:[(0,a.jsx)("style",{children:`
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
        `}),(0,a.jsxs)("div",{className:"faq-container",children:[(0,a.jsx)("header",{className:"faq-header",children:(0,a.jsxs)("div",{className:"faq-header-content",children:[(0,a.jsx)("div",{className:"faq-logo-wrapper",children:(0,a.jsx)(s.default,{src:"/web_logo.webp",width:64,height:64,alt:"لوگوی نوبیکس",priority:!0,quality:95,unoptimized:!0})}),(0,a.jsxs)("div",{className:"faq-header-text",children:[(0,a.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"12px",flexWrap:"wrap"},children:[(0,a.jsx)("span",{style:{margin:0,fontSize:13,fontWeight:800,letterSpacing:1,textTransform:"uppercase",color:"var(--primary)"},children:"Nubix Support Center"}),(0,a.jsxs)("div",{className:"faq-status-badge",children:[(0,a.jsx)("span",{className:"faq-status-dot"}),"مرکز پشتیبانی فعال است"]})]}),(0,a.jsx)("h1",{children:e}),(0,a.jsx)("p",{children:l})]})]})}),(0,a.jsxs)("div",{className:"faq-body-grid",children:[(0,a.jsxs)("aside",{className:"faq-sidebar",children:[(0,a.jsx)("nav",{className:"faq-nav",children:t.map(e=>(0,a.jsxs)("div",{className:"faq-nav-group",children:[(0,a.jsx)("span",{className:"faq-nav-group-title",children:e.title}),e.items.map(e=>{let s=e.id===b;return(0,a.jsx)(c.default,{href:e.href,className:`faq-nav-link ${s?"active":""}`,children:e.label},e.id)})]},e.title))}),(0,a.jsxs)("div",{className:"faq-popular-card",children:[(0,a.jsx)("h3",{className:"faq-trust-title",children:"محصولات پرفروش"}),(0,a.jsxs)("ul",{className:"faq-popular-links",children:[(0,a.jsx)("li",{children:(0,a.jsx)(c.default,{href:"/vbucks",children:"خرید وی باکس فورتنایت"})}),(0,a.jsx)("li",{children:(0,a.jsx)(c.default,{href:"/crewpack",children:"خرید کروپک فورتنایت"})}),(0,a.jsx)("li",{children:(0,a.jsx)(c.default,{href:"/product/chatgpt-subscription",children:"خرید اشتراک ChatGPT"})}),(0,a.jsx)("li",{children:(0,a.jsx)(c.default,{href:"/gemini",children:"خرید اشتراک Gemini"})}),(0,a.jsx)("li",{children:(0,a.jsx)(c.default,{href:"/gta6",children:"پیش‌خرید GTA 6"})})]})]}),(0,a.jsxs)("div",{className:"faq-trust-card",children:[(0,a.jsx)("h3",{className:"faq-trust-title",children:"پرداخت امن و قانونی"}),(0,a.jsx)("div",{className:"faq-trust-logos",children:n.map(e=>e.href.includes("enamad.ir")?(0,a.jsx)("a",{href:e.href,target:"_blank",referrerPolicy:"origin",className:"faq-trust-logo",children:(0,a.jsx)("img",{src:e.src,alt:e.alt,style:{width:e.width,height:e.height,objectFit:"contain",cursor:"pointer"},code:"BvHIZx1aeWqVhIlNuGSIySWJ49Yd2uE2",referrerPolicy:"origin"})},e.alt):(0,a.jsx)(c.default,{href:e.href,target:"_blank",rel:"noreferrer",className:"faq-trust-logo",children:(0,a.jsx)(s.default,{src:e.src,width:e.width,height:e.height,style:{objectFit:"contain"},alt:e.alt})},e.alt))}),(0,a.jsx)("p",{className:"faq-trust-note",children:"تمامی تراکنش‌ها در بستر درگاه بانکی رسمی و معتبر انجام پذیرفته و سفارشات گیمینگ از طریق حساب‌های قانونی خارج از کشور تحویل می‌گردند."})]}),(0,a.jsxs)(c.default,{href:"/",className:"faq-back-home",children:[(0,a.jsxs)("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,a.jsx)("path",{d:"M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"}),(0,a.jsx)("polyline",{points:"9 22 9 12 15 12 15 22"})]}),"بازگشت به فروشگاه"]})]}),(0,a.jsx)("main",{className:"faq-main-content",children:f})]})]})]})]})}])},47392,e=>{"use strict";var a=e.i(43476),s=e.i(21373);e.i(22016),e.i(95401);var c=e.i(71645),i=e.i(6731),r=e.i(78381);e.s(["default",0,function(){let[e,t]=(0,c.useState)("epic");return(0,a.jsx)(i.default,{title:"راهنمای خاموش کردن تایید دو مرحله‌ای (2FA)",subtitle:"پیش از ثبت سفارش، تایید دو مرحله‌ای حساب خود را غیرفعال کنید تا سفارش شما بدون هیچ تاخیری و در کوتاه‌ترین زمان انجام شود.",activeSection:"disable-2fa",children:(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf guide-article-container",children:[(0,a.jsx)(s.default,{id:"cc4ae92f0be1b6bf",children:'.guide-article-container.jsx-cc4ae92f0be1b6bf{flex-direction:column;gap:24px;width:100%;display:flex}.guide-article-box.jsx-cc4ae92f0be1b6bf{background:var(--card);border:1px solid var(--line);box-shadow:var(--shadow);border-radius:24px;overflow:hidden}.guide-article-banner.jsx-cc4ae92f0be1b6bf{background:linear-gradient(135deg,#ef4444,#f59e0b);align-items:flex-end;height:180px;padding:40px;display:flex;position:relative;overflow:hidden}.guide-article-banner.jsx-cc4ae92f0be1b6bf:before{content:"";pointer-events:none;background:radial-gradient(circle at 80% 20%,#ffffff26 0%,#0000 60%);position:absolute;inset:0}.guide-article-banner-icon.jsx-cc4ae92f0be1b6bf{opacity:.15;-webkit-user-select:none;user-select:none;color:#fff;font-size:80px;position:absolute;top:20px;left:20px}.guide-article-meta.jsx-cc4ae92f0be1b6bf{z-index:1;flex-direction:column;gap:8px;display:flex}.guide-article-tag.jsx-cc4ae92f0be1b6bf{color:#fff;-webkit-backdrop-filter:blur(4px);background:#fff3;border-radius:99px;align-self:flex-start;padding:4px 12px;font-size:12px;font-weight:800}.guide-article-banner.jsx-cc4ae92f0be1b6bf .page-banner-title.jsx-cc4ae92f0be1b6bf{color:#fff;text-shadow:0 2px 4px #0000001a;margin:0;font-size:28px;font-weight:900}.guide-article-info-bar.jsx-cc4ae92f0be1b6bf{border-bottom:1px solid var(--line);color:var(--muted);background:#ffffff05;gap:20px;padding:16px 40px;font-size:13px;display:flex}.guide-info-item.jsx-cc4ae92f0be1b6bf{align-items:center;gap:6px;display:flex}.guide-article-content.jsx-cc4ae92f0be1b6bf{color:var(--text);padding:40px;font-size:16px;line-height:1.9}.guide-intro.jsx-cc4ae92f0be1b6bf{color:var(--text);opacity:.95;margin-bottom:24px;font-size:16px}.warning-banner.jsx-cc4ae92f0be1b6bf{color:#ef4444;background:#ef44440d;border:2px solid #ef4444;border-radius:16px;align-items:center;gap:14px;margin-bottom:32px;padding:16px 20px;display:flex}.warning-banner.jsx-cc4ae92f0be1b6bf strong.jsx-cc4ae92f0be1b6bf{margin-bottom:2px;display:block}.warning-banner.jsx-cc4ae92f0be1b6bf div.jsx-cc4ae92f0be1b6bf{font-size:14px;line-height:1.5}[data-theme=dark] .warning-banner.jsx-cc4ae92f0be1b6bf{color:#f87171;background:#ef444414}.platform-tabs.jsx-cc4ae92f0be1b6bf{flex-wrap:wrap;gap:12px;margin-bottom:28px;display:flex}.platform-tab.jsx-cc4ae92f0be1b6bf{background:var(--bg);border:2px solid var(--line);color:var(--text);cursor:pointer;border-radius:14px;align-items:center;gap:10px;padding:12px 20px;font-size:14px;font-weight:700;transition:all .2s;display:flex}.platform-tab.jsx-cc4ae92f0be1b6bf:hover{border-color:var(--primary)}.platform-tab.active.jsx-cc4ae92f0be1b6bf{background:linear-gradient(135deg, var(--primary), var(--primary-2));border-color:var(--primary);color:#fff}.platform-tab.jsx-cc4ae92f0be1b6bf img.jsx-cc4ae92f0be1b6bf{object-fit:contain;width:20px;height:20px}.platform-tab.active.jsx-cc4ae92f0be1b6bf img.jsx-cc4ae92f0be1b6bf{filter:brightness(0)invert()}.guide-content.jsx-cc4ae92f0be1b6bf{background:var(--bg);border:1px solid var(--line);border-radius:20px;margin-bottom:32px;padding:32px}.guide-section.jsx-cc4ae92f0be1b6bf h2.jsx-cc4ae92f0be1b6bf{color:var(--text);border-bottom:1px solid var(--line);margin:0 0 24px;padding-bottom:12px;font-size:18px;font-weight:800}.step.jsx-cc4ae92f0be1b6bf{gap:16px;margin-bottom:24px;display:flex}.step.jsx-cc4ae92f0be1b6bf:last-child{margin-bottom:0}.step-number.jsx-cc4ae92f0be1b6bf{background:linear-gradient(135deg, var(--primary), var(--primary-2));color:#fff;border-radius:8px;flex-shrink:0;justify-content:center;align-items:center;width:32px;height:32px;font-size:15px;font-weight:800;display:flex}.step-content.jsx-cc4ae92f0be1b6bf{flex:1}.step-content.jsx-cc4ae92f0be1b6bf h3.jsx-cc4ae92f0be1b6bf{color:var(--text);margin:0 0 6px;font-size:15px;font-weight:800}.step-content.jsx-cc4ae92f0be1b6bf p.jsx-cc4ae92f0be1b6bf{color:var(--muted);margin:0;font-size:13px;line-height:1.6}.step-content.jsx-cc4ae92f0be1b6bf a.jsx-cc4ae92f0be1b6bf{color:var(--primary);text-decoration:underline}.step-content.jsx-cc4ae92f0be1b6bf ul.jsx-cc4ae92f0be1b6bf{margin:10px 0 0}.step-content.jsx-cc4ae92f0be1b6bf ul.jsx-cc4ae92f0be1b6bf:not(:is(:lang(ae),:lang(ar),:lang(arc),:lang(bcc),:lang(bqi),:lang(ckb),:lang(dv),:lang(fa),:lang(glk),:lang(he),:lang(ku),:lang(mzn),:lang(nqo),:lang(pnb),:lang(ps),:lang(sd),:lang(ug),:lang(ur),:lang(yi))){padding-left:20px}.step-content.jsx-cc4ae92f0be1b6bf ul.jsx-cc4ae92f0be1b6bf:is(:lang(ae),:lang(ar),:lang(arc),:lang(bcc),:lang(bqi),:lang(ckb),:lang(dv),:lang(fa),:lang(glk),:lang(he),:lang(ku),:lang(mzn),:lang(nqo),:lang(pnb),:lang(ps),:lang(sd),:lang(ug),:lang(ur),:lang(yi)){padding-right:20px}.step-content.jsx-cc4ae92f0be1b6bf li.jsx-cc4ae92f0be1b6bf{color:var(--muted);margin-bottom:4px;font-size:13px}.tip-box.jsx-cc4ae92f0be1b6bf{color:#10b981;background:#22c55e0d;border:1px solid #22c55e33;border-radius:12px;align-items:flex-start;gap:12px;margin-top:24px;padding:16px;display:flex}.tip-box.jsx-cc4ae92f0be1b6bf svg.jsx-cc4ae92f0be1b6bf{flex-shrink:0;margin-top:2px}.tip-box.jsx-cc4ae92f0be1b6bf p.jsx-cc4ae92f0be1b6bf{margin:0;font-size:13px;font-weight:700}.tip-box.warning.jsx-cc4ae92f0be1b6bf{color:#f59e0b;background:#f59e0b0d;border-color:#f59e0b33}[data-theme=dark] .tip-box.jsx-cc4ae92f0be1b6bf{color:#4ade80;background:#22c55e14}[data-theme=dark] .tip-box.warning.jsx-cc4ae92f0be1b6bf{color:#fbbf24;background:#f59e0b14}.guide-footer.jsx-cc4ae92f0be1b6bf{text-align:center;background:var(--bg);border:1px solid var(--line);border-radius:20px;padding:24px}.guide-footer.jsx-cc4ae92f0be1b6bf h3.jsx-cc4ae92f0be1b6bf{color:var(--text);margin:0 0 8px;font-size:16px;font-weight:800}.guide-footer.jsx-cc4ae92f0be1b6bf p.jsx-cc4ae92f0be1b6bf{color:var(--muted);margin:0 0 16px;font-size:13px}.support-btn.jsx-cc4ae92f0be1b6bf{color:#fff;background:linear-gradient(135deg,#08c,#06a);border-radius:12px;align-items:center;gap:10px;padding:12px 24px;font-size:14px;font-weight:700;text-decoration:none;transition:all .2s;display:inline-flex;box-shadow:0 4px 12px #08c3}.support-btn.jsx-cc4ae92f0be1b6bf:hover{transform:translateY(-2px);box-shadow:0 6px 16px #0088cc4d}@media (width<=768px){.guide-article-banner.jsx-cc4ae92f0be1b6bf{height:140px;padding:24px}.guide-article-banner.jsx-cc4ae92f0be1b6bf .page-banner-title.jsx-cc4ae92f0be1b6bf{font-size:20px}.guide-article-info-bar.jsx-cc4ae92f0be1b6bf{flex-wrap:wrap;gap:12px;padding:12px 24px}.guide-article-content.jsx-cc4ae92f0be1b6bf{padding:24px}.platform-tabs.jsx-cc4ae92f0be1b6bf{flex-direction:column}.platform-tab.jsx-cc4ae92f0be1b6bf{justify-content:center}.guide-content.jsx-cc4ae92f0be1b6bf{padding:20px 16px}}'}),(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf guide-article-box",children:[(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf guide-article-banner",children:[(0,a.jsx)("span",{className:"jsx-cc4ae92f0be1b6bf guide-article-banner-icon",children:"🔑"}),(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf guide-article-meta",children:[(0,a.jsx)("span",{className:"jsx-cc4ae92f0be1b6bf guide-article-tag",children:"راهنمای امنیتی"}),(0,a.jsx)("h2",{className:"jsx-cc4ae92f0be1b6bf page-banner-title",children:"غیرفعال‌سازی تایید دو مرحله‌ای (2FA)"})]})]}),(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf guide-article-info-bar",children:[(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf guide-info-item",children:[(0,a.jsx)("span",{className:"jsx-cc4ae92f0be1b6bf",children:"✍️"}),(0,a.jsx)("span",{className:"jsx-cc4ae92f0be1b6bf",children:"تنظیم‌کننده: بخش آموزش نوبیکس"})]}),(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf guide-info-item",children:[(0,a.jsx)("span",{className:"jsx-cc4ae92f0be1b6bf",children:"📅"}),(0,a.jsx)("span",{className:"jsx-cc4ae92f0be1b6bf",children:"بروزرسانی: ۱۱ تیر ۱۴۰۵"})]}),(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf guide-info-item",children:[(0,a.jsx)("span",{className:"jsx-cc4ae92f0be1b6bf",children:"⏱️"}),(0,a.jsx)("span",{className:"jsx-cc4ae92f0be1b6bf",children:"زمان مطالعه: ۵ دقیقه"})]})]}),(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf guide-article-content",children:[(0,a.jsx)("p",{className:"jsx-cc4ae92f0be1b6bf guide-intro",children:"برای تکمیل سریع سفارش و فعال‌سازی آیتم‌ها روی حساب شما، کارشناسان نوبیکس شاپ باید وارد اکانت بازی شوند. فعال بودن تایید دو مرحله‌ای (2FA) روند ورود تیم ما را متوقف کرده و ممکن است تحویل سفارش شما را تا ۴۸ ساعت به تعویق بیندازد. از این رو پیش از خرید، غیرفعال کردن 2FA را به شما توصیه می‌کنیم. مطمئن باشید تیم پشتیبانی نوبیکس تا لحظه تکمیل کامل سفارش در کنار شماست."}),(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf warning-banner",children:[(0,a.jsxs)("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",className:"jsx-cc4ae92f0be1b6bf",children:[(0,a.jsx)("circle",{cx:"12",cy:"12",r:"10",className:"jsx-cc4ae92f0be1b6bf"}),(0,a.jsx)("line",{x1:"12",y1:"8",x2:"12",y2:"12",className:"jsx-cc4ae92f0be1b6bf"}),(0,a.jsx)("line",{x1:"12",y1:"16",x2:"12.01",y2:"16",className:"jsx-cc4ae92f0be1b6bf"})]}),(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf",children:[(0,a.jsx)("strong",{className:"jsx-cc4ae92f0be1b6bf",children:"توجه مهم:"})," فعال بودن تایید دو مرحله‌ای هنگام خرید، سفارش شما را در وضعیت معلق نگه می‌دارد و تا زمان غیرفعال شدن آن، تحویل سفارش با تاخیر قابل توجهی روبه‌رو خواهد شد."]})]}),(0,a.jsx)("div",{className:"jsx-cc4ae92f0be1b6bf platform-tabs",children:[{id:"epic",label:"Epic Games",icon:"/icons/epic.svg"},{id:"xbox",label:"Xbox",icon:"/icons/xbox.svg"},{id:"playstation",label:"PlayStation",icon:"/icons/playstation.svg"}].map(s=>(0,a.jsxs)("button",{onClick:()=>t(s.id),className:`jsx-cc4ae92f0be1b6bf platform-tab ${e===s.id?"active":""}`,children:[(0,a.jsx)("img",{src:s.icon,alt:s.label,width:20,height:20,className:"jsx-cc4ae92f0be1b6bf"}),s.label]},s.id))}),(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf guide-content",children:[(0,a.jsxs)("div",{hidden:"epic"!==e,className:"jsx-cc4ae92f0be1b6bf guide-section",children:[(0,a.jsx)("h2",{className:"jsx-cc4ae92f0be1b6bf",children:"غیرفعال‌سازی 2FA در Epic Games"}),(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf step",children:[(0,a.jsx)("div",{className:"jsx-cc4ae92f0be1b6bf step-number",children:"۱"}),(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf step-content",children:[(0,a.jsx)("h3",{className:"jsx-cc4ae92f0be1b6bf",children:"ورود به حساب Epic Games"}),(0,a.jsxs)("p",{className:"jsx-cc4ae92f0be1b6bf",children:["به بخش تنظیمات امنیتی سایت رسمی اپیک گیمز به نشانی"," ",(0,a.jsx)("a",{href:"https://www.epicgames.com/account/password",target:"_blank",rel:"noopener noreferrer",className:"jsx-cc4ae92f0be1b6bf",children:"epicgames.com/account/password"})," ","مراجعه کرده و وارد اکانت خود شوید."]})]})]}),(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf step",children:[(0,a.jsx)("div",{className:"jsx-cc4ae92f0be1b6bf step-number",children:"۲"}),(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf step-content",children:[(0,a.jsx)("h3",{className:"jsx-cc4ae92f0be1b6bf",children:"بخش Password & Security"}),(0,a.jsxs)("p",{className:"jsx-cc4ae92f0be1b6bf",children:["پس از ورود، از منوی کاربری، گزینه ",(0,a.jsx)("strong",{className:"jsx-cc4ae92f0be1b6bf",children:"PASSWORD & SECURITY"})," را انتخاب کنید."]})]})]}),(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf step",children:[(0,a.jsx)("div",{className:"jsx-cc4ae92f0be1b6bf step-number",children:"۳"}),(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf step-content",children:[(0,a.jsx)("h3",{className:"jsx-cc4ae92f0be1b6bf",children:"غیرفعال کردن روش‌های تایید هویت"}),(0,a.jsxs)("p",{className:"jsx-cc4ae92f0be1b6bf",children:["در پایین صفحه به بخش ",(0,a.jsx)("strong",{className:"jsx-cc4ae92f0be1b6bf",children:"TWO-FACTOR AUTHENTICATION"})," بروید و تمام روش‌های فعال را غیرفعال کنید:"]}),(0,a.jsxs)("ul",{className:"jsx-cc4ae92f0be1b6bf",children:[(0,a.jsx)("li",{className:"jsx-cc4ae92f0be1b6bf",children:"Authenticator App"}),(0,a.jsx)("li",{className:"jsx-cc4ae92f0be1b6bf",children:"Email Authentication"}),(0,a.jsx)("li",{className:"jsx-cc4ae92f0be1b6bf",children:"SMS Authentication"})]})]})]}),(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf step",children:[(0,a.jsx)("div",{className:"jsx-cc4ae92f0be1b6bf step-number",children:"۴"}),(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf step-content",children:[(0,a.jsx)("h3",{className:"jsx-cc4ae92f0be1b6bf",children:"تایید تغییرات"}),(0,a.jsx)("p",{className:"jsx-cc4ae92f0be1b6bf",children:"در صورت ارسال کد امنیتی به ایمیل یا شماره موبایل، آن را وارد کنید تا فرآیند غیرفعال‌سازی تکمیل شود."})]})]}),(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf tip-box",children:[(0,a.jsxs)("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",className:"jsx-cc4ae92f0be1b6bf",children:[(0,a.jsx)("circle",{cx:"12",cy:"12",r:"10",className:"jsx-cc4ae92f0be1b6bf"}),(0,a.jsx)("path",{d:"M12 16v-4",className:"jsx-cc4ae92f0be1b6bf"}),(0,a.jsx)("path",{d:"M12 8h.01",className:"jsx-cc4ae92f0be1b6bf"})]}),(0,a.jsx)("p",{className:"jsx-cc4ae92f0be1b6bf",children:"پس از تحویل نهایی سفارش و فعال‌سازی محصولات، می‌توانید تایید دو مرحله‌ای حساب خود را دوباره فعال کنید."})]})]}),(0,a.jsxs)("div",{hidden:"xbox"!==e,className:"jsx-cc4ae92f0be1b6bf guide-section",children:[(0,a.jsx)("h2",{className:"jsx-cc4ae92f0be1b6bf",children:"غیرفعال‌سازی 2FA در Xbox (مایکروسافت)"}),(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf step",children:[(0,a.jsx)("div",{className:"jsx-cc4ae92f0be1b6bf step-number",children:"۱"}),(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf step-content",children:[(0,a.jsx)("h3",{className:"jsx-cc4ae92f0be1b6bf",children:"ورود به پرتال امنیتی مایکروسافت"}),(0,a.jsxs)("p",{className:"jsx-cc4ae92f0be1b6bf",children:["به آدرس مدیریت امنیت حساب به نشانی"," ",(0,a.jsx)("a",{href:"https://account.microsoft.com/security",target:"_blank",rel:"noopener noreferrer",className:"jsx-cc4ae92f0be1b6bf",children:"account.microsoft.com/security"})," ","مراجعه کنید و با حساب ایکس‌باکس خود وارد شوید."]})]})]}),(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf step",children:[(0,a.jsx)("div",{className:"jsx-cc4ae92f0be1b6bf step-number",children:"۲"}),(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf step-content",children:[(0,a.jsx)("h3",{className:"jsx-cc4ae92f0be1b6bf",children:"بخش Advanced Security Options"}),(0,a.jsxs)("p",{className:"jsx-cc4ae92f0be1b6bf",children:["روی کارت ",(0,a.jsx)("strong",{className:"jsx-cc4ae92f0be1b6bf",children:"Advanced security options"})," کلیک کنید تا گزینه‌های امنیتی پیشرفته نمایش داده شوند."]})]})]}),(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf step",children:[(0,a.jsx)("div",{className:"jsx-cc4ae92f0be1b6bf step-number",children:"۳"}),(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf step-content",children:[(0,a.jsx)("h3",{className:"jsx-cc4ae92f0be1b6bf",children:"غیرفعال کردن Two-step verification"}),(0,a.jsxs)("p",{className:"jsx-cc4ae92f0be1b6bf",children:["صفحه را به پایین بکشید و در بخش ",(0,a.jsx)("strong",{className:"jsx-cc4ae92f0be1b6bf",children:"Two-step verification"}),"، روی دکمه ",(0,a.jsx)("strong",{className:"jsx-cc4ae92f0be1b6bf",children:"Turn off"})," کلیک کرده و آن را تایید کنید."]})]})]}),(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf step",children:[(0,a.jsx)("div",{className:"jsx-cc4ae92f0be1b6bf step-number",children:"۴"}),(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf step-content",children:[(0,a.jsx)("h3",{className:"jsx-cc4ae92f0be1b6bf",children:"حذف موقت Authenticator App"}),(0,a.jsxs)("p",{className:"jsx-cc4ae92f0be1b6bf",children:["اگر از اپلیکیشن Microsoft Authenticator استفاده می‌کنید، بهتر است دسترسی آن را به‌طور موقت از بخش ",(0,a.jsx)("strong",{className:"jsx-cc4ae92f0be1b6bf",children:"Ways to prove who you are"})," حذف کنید."]})]})]}),(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf tip-box warning",children:[(0,a.jsxs)("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",className:"jsx-cc4ae92f0be1b6bf",children:[(0,a.jsx)("path",{d:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",className:"jsx-cc4ae92f0be1b6bf"}),(0,a.jsx)("line",{x1:"12",y1:"9",x2:"12",y2:"13",className:"jsx-cc4ae92f0be1b6bf"}),(0,a.jsx)("line",{x1:"12",y1:"17",x2:"12.01",y2:"17",className:"jsx-cc4ae92f0be1b6bf"})]}),(0,a.jsx)("p",{className:"jsx-cc4ae92f0be1b6bf",children:"اگر روی حساب مایکروسافت خود Passkey فعال کرده‌اید، برای جلوگیری از مسدود شدن ورود، آن را نیز غیرفعال کنید."})]})]}),(0,a.jsxs)("div",{hidden:"playstation"!==e,className:"jsx-cc4ae92f0be1b6bf guide-section",children:[(0,a.jsx)("h2",{className:"jsx-cc4ae92f0be1b6bf",children:"غیرفعال‌سازی 2FA در PlayStation (PSN)"}),(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf step",children:[(0,a.jsx)("div",{className:"jsx-cc4ae92f0be1b6bf step-number",children:"۱"}),(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf step-content",children:[(0,a.jsx)("h3",{className:"jsx-cc4ae92f0be1b6bf",children:"ورود به پرتال امنیتی PSN"}),(0,a.jsxs)("p",{className:"jsx-cc4ae92f0be1b6bf",children:["به آدرس مدیریت حساب پلی‌استیشن به نشانی"," ",(0,a.jsx)("a",{href:"https://www.playstation.com/acct/security",target:"_blank",rel:"noopener noreferrer",className:"jsx-cc4ae92f0be1b6bf",children:"playstation.com/acct/security"})," ","بروید و با مشخصات اکانت پی‌اس‌ان خود وارد شوید."]})]})]}),(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf step",children:[(0,a.jsx)("div",{className:"jsx-cc4ae92f0be1b6bf step-number",children:"۲"}),(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf step-content",children:[(0,a.jsx)("h3",{className:"jsx-cc4ae92f0be1b6bf",children:"بخش Security"}),(0,a.jsxs)("p",{className:"jsx-cc4ae92f0be1b6bf",children:["از منوی سمت چپ به بخش ",(0,a.jsx)("strong",{className:"jsx-cc4ae92f0be1b6bf",children:"Security"})," مراجعه کنید."]})]})]}),(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf step",children:[(0,a.jsx)("div",{className:"jsx-cc4ae92f0be1b6bf step-number",children:"۳"}),(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf step-content",children:[(0,a.jsx)("h3",{className:"jsx-cc4ae92f0be1b6bf",children:"غیرفعال کردن 2-Step Verification"}),(0,a.jsxs)("p",{className:"jsx-cc4ae92f0be1b6bf",children:["در بخش ",(0,a.jsx)("strong",{className:"jsx-cc4ae92f0be1b6bf",children:"2-Step Verification"})," روی دکمه Edit کلیک کنید، وضعیت (Status) را به ",(0,a.jsx)("strong",{className:"jsx-cc4ae92f0be1b6bf",children:"Off"})," تغییر دهید و تغییرات را ذخیره کنید."]})]})]}),(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf step",children:[(0,a.jsx)("div",{className:"jsx-cc4ae92f0be1b6bf step-number",children:"۴"}),(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf step-content",children:[(0,a.jsx)("h3",{className:"jsx-cc4ae92f0be1b6bf",children:"تایید تغییرات با کد پیامکی"}),(0,a.jsx)("p",{className:"jsx-cc4ae92f0be1b6bf",children:"در صورت درخواست کد پیامکی، کد ارسال‌شده به تلفن همراه خود را وارد کنید تا غیرفعال‌سازی تکمیل شود."})]})]}),(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf tip-box",children:[(0,a.jsxs)("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",className:"jsx-cc4ae92f0be1b6bf",children:[(0,a.jsx)("circle",{cx:"12",cy:"12",r:"10",className:"jsx-cc4ae92f0be1b6bf"}),(0,a.jsx)("path",{d:"M12 16v-4",className:"jsx-cc4ae92f0be1b6bf"}),(0,a.jsx)("path",{d:"M12 8h.01",className:"jsx-cc4ae92f0be1b6bf"})]}),(0,a.jsx)("p",{className:"jsx-cc4ae92f0be1b6bf",children:"پشتیبانی نوبیکس توصیه می‌کند پس از تکمیل و تحویل کامل سفارش، تایید دو مرحله‌ای حساب خود را دوباره فعال کنید."})]})]})]}),(0,a.jsxs)("div",{className:"jsx-cc4ae92f0be1b6bf guide-footer",children:[(0,a.jsx)("h3",{className:"jsx-cc4ae92f0be1b6bf",children:"در غیرفعال کردن تایید دو مرحله‌ای به کمک نیاز دارید؟"}),(0,a.jsx)("p",{className:"jsx-cc4ae92f0be1b6bf",children:"اگر با خطا مواجه شدید یا مراحل بالا نتیجه نداد، کارشناسان پشتیبانی نوبیکس در تلگرام تا تکمیل کامل سفارش همراه شما هستند."}),(0,a.jsxs)("a",{href:"https://t.me/Nubixsupport",target:"_blank",rel:"noopener noreferrer",className:"jsx-cc4ae92f0be1b6bf support-btn",children:[(0,a.jsx)("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"currentColor",className:"jsx-cc4ae92f0be1b6bf",children:(0,a.jsx)("path",{d:"M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.242-1.865-.442-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.099.155.232.171.325.016.093.036.305.02.471z",className:"jsx-cc4ae92f0be1b6bf"})}),"ارتباط با پشتیبانی نوبیکس در تلگرام"]})]})]})]}),(0,a.jsx)(r.default,{})]})})}])}]);