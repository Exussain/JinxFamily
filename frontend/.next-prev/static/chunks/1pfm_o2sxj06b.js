(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,6505,a=>{"use strict";let e={"fortnite-freediver":"/products/freediver.webp","fortnite-crew-pack":"/products/crewpack.webp","fortnite-starter-pack":"/products/starterpack.webp","fortnite-battle-pass":"/products/battlepass.webp","fortnite-music-pass":"/products/musicpass.webp","gift-battle-pass":"/products/battlepass.webp","fortnite-save-the-world":"/products/savetheworld.webp","fortnite-glided-elite-pack":"/products/pack_glided_elites.webp","v-bucks":"/products/product_vbucks.webp","lego-starter-pack":"/products/lego_starter_pack.webp","pack-agency-renegades":"/products/pack_agency_renegades.webp","agency-renegades":"/products/pack_agency_renegades.webp","pack-frozen-legends":"/products/pack_frozen_legends.webp","frozen-legends":"/products/pack_frozen_legends.webp","pack-polar-legends":"/products/pack_polar_legends.webp","polar-legends":"/products/pack_polar_legends.webp","spotify-subscription":"/products/spotify.webp","chatgpt-subscription":"/products/chatgpt.webp","gemini-subscription":"/products/gemini.webp","change-region-turkey":"/products/change-region-turkey.webp"};function s(a){return"string"!=typeof a?"":a.replace(/\.(webp|png|jpe?g|svg)$/i,"")}function i(a){if("string"!=typeof a||!a.startsWith("/media/"))return a;let e="".replace(/\/+$/,"");return e?`${e}${a}`:a}a.s(["resolveProductImage",0,function(a={}){let r="string"==typeof a.slug?a.slug.trim().toLowerCase():"",t=r?e[r]:"",f=a.image_url||a.imageUrl||a.image||a.imageSrc||t||"",d=a.image_base||a.imageBase||("string"==typeof f&&f.startsWith("/")?s(f):""),n="string"==typeof f&&f.length>0?i(f):"string"==typeof d&&/\.[a-z0-9]+$/i.test(d)?i(d):"";return{imageBase:"string"==typeof d&&d.length>0&&!/\.[a-z0-9]+$/i.test(d)?d:"string"==typeof n&&n.startsWith("/")?s(n):"",imageSrc:n}}])},42043,a=>{"use strict";var e=a.i(43476),s=a.i(57688);let i=/\.webp(?:[?#].*)?$/i,r=/^(https?:)?\/\//i;a.s(["default",0,function({src:a,alt:t,base:f,fit:d="cover",eager:n=!1}){let l=a||(f?`${f}.webp`:null);if(!l)return null;let c=i.test(l);return r.test(l)?(0,e.jsx)("img",{src:l,alt:t,loading:n?"eager":"lazy",fetchPriority:n?"high":void 0,decoding:"async",style:{width:"100%",height:"100%",objectFit:d},draggable:"false"}):(0,e.jsx)(s.default,{src:l,alt:t,fill:!0,sizes:"(max-width: 640px) 100vw, 33vw",quality:95,unoptimized:c,priority:n,style:{objectFit:d}})}])},78381,a=>{"use strict";var e=a.i(43476),s=a.i(21373),i=a.i(71645);a.s(["default",0,function(){let[a,r]=(0,i.useState)(null);return(0,e.jsxs)("div",{className:"jsx-d68c3f20f7facd4c helpfulness-widget",children:[(0,e.jsx)(s.default,{id:"d68c3f20f7facd4c",children:".helpfulness-widget.jsx-d68c3f20f7facd4c{border:1px dashed var(--line);background:#ffffff05;border-radius:20px;justify-content:space-between;align-items:center;gap:20px;margin-top:40px;padding:24px;transition:all .3s;display:flex}.helpfulness-title.jsx-d68c3f20f7facd4c{color:var(--text);margin:0;font-size:15px;font-weight:800}.helpfulness-buttons.jsx-d68c3f20f7facd4c{gap:12px;display:flex}.help-btn.jsx-d68c3f20f7facd4c{cursor:pointer;background:var(--card);border:1px solid var(--line);color:var(--muted);border-radius:12px;align-items:center;gap:8px;padding:8px 16px;font-family:inherit;font-size:13px;font-weight:700;transition:all .25s;display:flex}.help-btn.jsx-d68c3f20f7facd4c:hover{border-color:var(--primary);color:var(--primary);transform:translateY(-1px)}.help-btn.yes.jsx-d68c3f20f7facd4c:hover{color:#10b981;background:#10b98114;border-color:#10b981}.help-btn.no.jsx-d68c3f20f7facd4c:hover{color:#ef4444;background:#ef444414;border-color:#ef4444}.thank-you-msg.jsx-d68c3f20f7facd4c{color:#10b981;align-items:center;gap:8px;font-size:14px;font-weight:700;animation:.3s forwards slideUp;display:flex}@keyframes slideUp{0%{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}@media (width<=640px){.helpfulness-widget.jsx-d68c3f20f7facd4c{text-align:center;flex-direction:column;align-items:stretch;gap:16px}.helpfulness-buttons.jsx-d68c3f20f7facd4c{justify-content:center}}"}),null===a?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("h4",{className:"jsx-d68c3f20f7facd4c helpfulness-title",children:"آیا این مقاله آموزشی مفید بود؟"}),(0,e.jsxs)("div",{className:"jsx-d68c3f20f7facd4c helpfulness-buttons",children:[(0,e.jsxs)("button",{onClick:()=>r("yes"),className:"jsx-d68c3f20f7facd4c help-btn yes",children:[(0,e.jsx)("span",{className:"jsx-d68c3f20f7facd4c",children:"👍"})," بله، مفید بود"]}),(0,e.jsxs)("button",{onClick:()=>r("no"),className:"jsx-d68c3f20f7facd4c help-btn no",children:[(0,e.jsx)("span",{className:"jsx-d68c3f20f7facd4c",children:"👎"})," خیر، کامل نبود"]})]})]}):(0,e.jsxs)("div",{style:{margin:"0 auto"},className:"jsx-d68c3f20f7facd4c thank-you-msg",children:[(0,e.jsx)("span",{className:"jsx-d68c3f20f7facd4c",children:"💖"}),"yes"===a?"خوشحالیم که این مقاله برایتان مفید بوده است! سپاس از بازخورد شما.":"ممنون از بازخورد شما. تلاش می‌کنیم این راهنما را در آینده بهبود ببخشیم."]})]})}])},6731,a=>{"use strict";var e=a.i(43476),s=a.i(57688),i=a.i(22016),r=a.i(95401),t=a.i(71645);let f=[{title:"راهنما و پشتیبانی",items:[{id:"faq",label:"سوالات متداول",href:"/faq"},{id:"about",label:"درباره نوبیکس",href:"/faq/about"},{id:"contact",label:"تماس با ما",href:"/faq/contact"},{id:"how-to-buy",label:"راهنمای خرید",href:"/faq/how-to-buy"}]},{title:"قوانین و حریم خصوصی",items:[{id:"rules",label:"قوانین و مقررات",href:"/faq/rules"},{id:"privacy",label:"حریم خصوصی",href:"/faq/privacy"}]},{title:"راهنمای اکانت",items:[{id:"disable-2fa",label:"خاموش کردن ۲FA",href:"/guides/disable-2fa"},{id:"link-unlink",label:"لینک و آنلینک اکانت",href:"/guides/link-unlink"},{id:"remove-restriction",label:"رفع محدودیت حساب",href:"/guides/remove-restriction"}]}],d=[{href:"https://trustseal.enamad.ir/?id=671892&Code=BvHIZx1aeWqVhIlNuGSIySWJ49Yd2uE2",src:"https://trustseal.enamad.ir/logo.aspx?id=671892&Code=BvHIZx1aeWqVhIlNuGSIySWJ49Yd2uE2",alt:"نماد اعتماد الکترونیکی نوبیکس",width:45,height:45},{href:"https://www.zarinpal.com/trustPage/nubixshop.ir",src:"/icons/ZarinPal.svg",alt:"درگاه پرداخت زرین‌پال",width:120,height:40}];a.s(["default",0,function({title:a,subtitle:n,activeSection:l,children:c}){return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(t.Suspense,{fallback:null,children:(0,e.jsx)(r.default,{})}),(0,e.jsxs)("div",{className:"faq-page-wrapper",children:[(0,e.jsx)("style",{children:`
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
        `}),(0,e.jsxs)("div",{className:"faq-container",children:[(0,e.jsx)("header",{className:"faq-header",children:(0,e.jsxs)("div",{className:"faq-header-content",children:[(0,e.jsx)("div",{className:"faq-logo-wrapper",children:(0,e.jsx)(s.default,{src:"/web_logo.webp",width:64,height:64,alt:"لوگوی نوبیکس",priority:!0,quality:95,unoptimized:!0})}),(0,e.jsxs)("div",{className:"faq-header-text",children:[(0,e.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"12px",flexWrap:"wrap"},children:[(0,e.jsx)("span",{style:{margin:0,fontSize:13,fontWeight:800,letterSpacing:1,textTransform:"uppercase",color:"var(--primary)"},children:"Nubix Support Center"}),(0,e.jsxs)("div",{className:"faq-status-badge",children:[(0,e.jsx)("span",{className:"faq-status-dot"}),"مرکز پشتیبانی فعال است"]})]}),(0,e.jsx)("h1",{children:a}),(0,e.jsx)("p",{children:n})]})]})}),(0,e.jsxs)("div",{className:"faq-body-grid",children:[(0,e.jsxs)("aside",{className:"faq-sidebar",children:[(0,e.jsx)("nav",{className:"faq-nav",children:f.map(a=>(0,e.jsxs)("div",{className:"faq-nav-group",children:[(0,e.jsx)("span",{className:"faq-nav-group-title",children:a.title}),a.items.map(a=>{let s=a.id===l;return(0,e.jsx)(i.default,{href:a.href,className:`faq-nav-link ${s?"active":""}`,children:a.label},a.id)})]},a.title))}),(0,e.jsxs)("div",{className:"faq-popular-card",children:[(0,e.jsx)("h3",{className:"faq-trust-title",children:"محصولات پرفروش"}),(0,e.jsxs)("ul",{className:"faq-popular-links",children:[(0,e.jsx)("li",{children:(0,e.jsx)(i.default,{href:"/vbucks",children:"خرید وی باکس فورتنایت"})}),(0,e.jsx)("li",{children:(0,e.jsx)(i.default,{href:"/crewpack",children:"خرید کروپک فورتنایت"})}),(0,e.jsx)("li",{children:(0,e.jsx)(i.default,{href:"/product/chatgpt-subscription",children:"خرید اشتراک ChatGPT"})}),(0,e.jsx)("li",{children:(0,e.jsx)(i.default,{href:"/gemini",children:"خرید اشتراک Gemini"})}),(0,e.jsx)("li",{children:(0,e.jsx)(i.default,{href:"/gta6",children:"پیش‌خرید GTA 6"})})]})]}),(0,e.jsxs)("div",{className:"faq-trust-card",children:[(0,e.jsx)("h3",{className:"faq-trust-title",children:"پرداخت امن و قانونی"}),(0,e.jsx)("div",{className:"faq-trust-logos",children:d.map(a=>a.href.includes("enamad.ir")?(0,e.jsx)("a",{href:a.href,target:"_blank",referrerPolicy:"origin",className:"faq-trust-logo",children:(0,e.jsx)("img",{src:a.src,alt:a.alt,style:{width:a.width,height:a.height,objectFit:"contain",cursor:"pointer"},code:"BvHIZx1aeWqVhIlNuGSIySWJ49Yd2uE2",referrerPolicy:"origin"})},a.alt):(0,e.jsx)(i.default,{href:a.href,target:"_blank",rel:"noreferrer",className:"faq-trust-logo",children:(0,e.jsx)(s.default,{src:a.src,width:a.width,height:a.height,style:{objectFit:"contain"},alt:a.alt})},a.alt))}),(0,e.jsx)("p",{className:"faq-trust-note",children:"تمامی تراکنش‌ها در بستر درگاه بانکی رسمی و معتبر انجام پذیرفته و سفارشات گیمینگ از طریق حساب‌های قانونی خارج از کشور تحویل می‌گردند."})]}),(0,e.jsxs)(i.default,{href:"/",className:"faq-back-home",children:[(0,e.jsxs)("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,e.jsx)("path",{d:"M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"}),(0,e.jsx)("polyline",{points:"9 22 9 12 15 12 15 22"})]}),"بازگشت به فروشگاه"]})]}),(0,e.jsx)("main",{className:"faq-main-content",children:c})]})]})]})]})}])},4214,a=>{"use strict";var e=a.i(43476),s=a.i(21373),i=a.i(22016);a.i(95401),a.i(71645);var r=a.i(6731),t=a.i(78381);a.s(["default",0,function(){return(0,e.jsx)(r.default,{title:"راهنمای رفع محدودیت حساب (Remove Restriction)",subtitle:"آموزش رفع محدودیت‌های امنیتی، قفل موقت و خطاهای ورود در حساب‌های Epic Games، Xbox و PlayStation",activeSection:"remove-restriction",children:(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 guide-article-container",children:[(0,e.jsx)(s.default,{id:"d0a39f07f4f8a480",children:'.guide-article-container.jsx-d0a39f07f4f8a480{flex-direction:column;gap:24px;width:100%;display:flex}.guide-article-box.jsx-d0a39f07f4f8a480{background:var(--card);border:1px solid var(--line);box-shadow:var(--shadow);border-radius:24px;overflow:hidden}.guide-article-banner.jsx-d0a39f07f4f8a480{background:linear-gradient(135deg,#f59e0b,#d97706);align-items:flex-end;height:180px;padding:40px;display:flex;position:relative;overflow:hidden}.guide-article-banner.jsx-d0a39f07f4f8a480:before{content:"";pointer-events:none;background:radial-gradient(circle at 80% 20%,#ffffff26 0%,#0000 60%);position:absolute;inset:0}.guide-article-banner-icon.jsx-d0a39f07f4f8a480{opacity:.15;-webkit-user-select:none;user-select:none;color:#fff;font-size:80px;position:absolute;top:20px;left:20px}.guide-article-meta.jsx-d0a39f07f4f8a480{z-index:1;flex-direction:column;gap:8px;display:flex}.guide-article-tag.jsx-d0a39f07f4f8a480{color:#fff;-webkit-backdrop-filter:blur(4px);background:#fff3;border-radius:99px;align-self:flex-start;padding:4px 12px;font-size:12px;font-weight:800}.guide-article-banner.jsx-d0a39f07f4f8a480 .page-banner-title.jsx-d0a39f07f4f8a480{color:#fff;text-shadow:0 2px 4px #0000001a;margin:0;font-size:28px;font-weight:900}.guide-article-info-bar.jsx-d0a39f07f4f8a480{border-bottom:1px solid var(--line);color:var(--muted);background:#ffffff05;gap:20px;padding:16px 40px;font-size:13px;display:flex}.guide-info-item.jsx-d0a39f07f4f8a480{align-items:center;gap:6px;display:flex}.guide-article-content.jsx-d0a39f07f4f8a480{color:var(--text);padding:40px;font-size:16px;line-height:1.9}.guide-intro.jsx-d0a39f07f4f8a480{color:var(--text);opacity:.95;margin-bottom:24px;font-size:16px}.info-banner.jsx-d0a39f07f4f8a480{color:#d97706;background:#f59e0b0d;border:2px solid #f59e0b;border-radius:16px;align-items:flex-start;gap:14px;margin-bottom:32px;padding:16px 20px;display:flex}.info-banner.jsx-d0a39f07f4f8a480 svg.jsx-d0a39f07f4f8a480{flex-shrink:0;margin-top:2px}.info-banner.jsx-d0a39f07f4f8a480 strong.jsx-d0a39f07f4f8a480{margin-bottom:4px;display:block}.info-banner.jsx-d0a39f07f4f8a480 p.jsx-d0a39f07f4f8a480{margin:0;font-size:14px;line-height:1.5}[data-theme=dark] .info-banner.jsx-d0a39f07f4f8a480{color:#fbbf24;background:#f59e0b14}.guide-content.jsx-d0a39f07f4f8a480{flex-direction:column;gap:28px;margin-bottom:32px;display:flex}.platform-section.jsx-d0a39f07f4f8a480{background:var(--bg);border:1px solid var(--line);border-radius:20px;padding:28px}.platform-header.jsx-d0a39f07f4f8a480{border-bottom:1px solid var(--line);align-items:center;gap:12px;margin-bottom:20px;padding-bottom:14px;display:flex}.platform-header.jsx-d0a39f07f4f8a480 img.jsx-d0a39f07f4f8a480{object-fit:contain;width:28px;height:28px}.platform-header.jsx-d0a39f07f4f8a480 h2.jsx-d0a39f07f4f8a480{color:var(--text);margin:0;font-size:18px;font-weight:800}.restriction-type.jsx-d0a39f07f4f8a480{background:var(--card);border:1px solid var(--line);border-radius:14px;margin-bottom:20px;padding:20px}.restriction-type.jsx-d0a39f07f4f8a480:last-child{margin-bottom:0}.restriction-type.jsx-d0a39f07f4f8a480 h3.jsx-d0a39f07f4f8a480{color:var(--text);margin:0 0 10px;font-size:15px;font-weight:800}.restriction-type.jsx-d0a39f07f4f8a480>p.jsx-d0a39f07f4f8a480{color:var(--muted);margin:0 0 16px;font-size:13px;line-height:1.6}.steps-compact.jsx-d0a39f07f4f8a480{flex-direction:column;gap:10px;display:flex}.step-compact.jsx-d0a39f07f4f8a480{color:var(--text);align-items:center;gap:12px;font-size:13px;display:flex}.step-num.jsx-d0a39f07f4f8a480{background:linear-gradient(135deg, var(--primary), var(--primary-2));color:#fff;border-radius:6px;flex-shrink:0;justify-content:center;align-items:center;width:24px;height:24px;font-size:11px;font-weight:850;display:flex}.step-compact.jsx-d0a39f07f4f8a480 a.jsx-d0a39f07f4f8a480{color:var(--primary);text-decoration:underline}.tip-section.jsx-d0a39f07f4f8a480{margin-top:24px;margin-bottom:32px}.tip-card.jsx-d0a39f07f4f8a480{color:#10b981;background:#22c55e0d;border:1px solid #22c55e33;border-radius:16px;align-items:flex-start;gap:16px;padding:20px;display:flex}.tip-card.jsx-d0a39f07f4f8a480 svg.jsx-d0a39f07f4f8a480{flex-shrink:0}.tip-card.jsx-d0a39f07f4f8a480 h4.jsx-d0a39f07f4f8a480{margin:0 0 6px;font-size:15px;font-weight:800}.tip-card.jsx-d0a39f07f4f8a480 p.jsx-d0a39f07f4f8a480{margin:0 0 10px;font-size:13px}.tip-link.jsx-d0a39f07f4f8a480{color:#10b981;align-items:center;gap:6px;font-size:13px;font-weight:700;text-decoration:underline;display:inline-flex}[data-theme=dark] .tip-card.jsx-d0a39f07f4f8a480{color:#4ade80;background:#22c55e14}[data-theme=dark] .tip-link.jsx-d0a39f07f4f8a480{color:#4ade80}.guide-footer.jsx-d0a39f07f4f8a480{text-align:center;background:var(--bg);border:1px solid var(--line);border-radius:20px;padding:24px}.guide-footer.jsx-d0a39f07f4f8a480 h3.jsx-d0a39f07f4f8a480{color:var(--text);margin:0 0 8px;font-size:16px;font-weight:800}.guide-footer.jsx-d0a39f07f4f8a480 p.jsx-d0a39f07f4f8a480{color:var(--muted);margin:0 0 16px;font-size:13px}.support-btn.jsx-d0a39f07f4f8a480{color:#fff;background:linear-gradient(135deg,#08c,#06a);border-radius:12px;align-items:center;gap:10px;padding:12px 24px;font-size:14px;font-weight:700;text-decoration:none;transition:all .2s;display:inline-flex;box-shadow:0 4px 12px #08c3}.support-btn.jsx-d0a39f07f4f8a480:hover{transform:translateY(-2px);box-shadow:0 6px 16px #0088cc4d}@media (width<=768px){.guide-article-banner.jsx-d0a39f07f4f8a480{height:140px;padding:24px}.guide-article-banner.jsx-d0a39f07f4f8a480 .page-banner-title.jsx-d0a39f07f4f8a480{font-size:20px}.guide-article-info-bar.jsx-d0a39f07f4f8a480{flex-wrap:wrap;gap:12px;padding:12px 24px}.guide-article-content.jsx-d0a39f07f4f8a480{padding:24px}.platform-section.jsx-d0a39f07f4f8a480{padding:20px 16px}.restriction-type.jsx-d0a39f07f4f8a480{padding:16px}}'}),(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 guide-article-box",children:[(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 guide-article-banner",children:[(0,e.jsx)("span",{className:"jsx-d0a39f07f4f8a480 guide-article-banner-icon",children:"🛡️"}),(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 guide-article-meta",children:[(0,e.jsx)("span",{className:"jsx-d0a39f07f4f8a480 guide-article-tag",children:"راهنمای امنیتی"}),(0,e.jsx)("h2",{className:"jsx-d0a39f07f4f8a480 page-banner-title",children:"راهنمای رفع محدودیت‌های موقت حساب"})]})]}),(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 guide-article-info-bar",children:[(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 guide-info-item",children:[(0,e.jsx)("span",{className:"jsx-d0a39f07f4f8a480",children:"✍️"}),(0,e.jsx)("span",{className:"jsx-d0a39f07f4f8a480",children:"تنظیم‌کننده: بخش آموزش نوبیکس"})]}),(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 guide-info-item",children:[(0,e.jsx)("span",{className:"jsx-d0a39f07f4f8a480",children:"📅"}),(0,e.jsx)("span",{className:"jsx-d0a39f07f4f8a480",children:"بروزرسانی: ۱۱ تیر ۱۴۰۵"})]}),(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 guide-info-item",children:[(0,e.jsx)("span",{className:"jsx-d0a39f07f4f8a480",children:"⏱️"}),(0,e.jsx)("span",{className:"jsx-d0a39f07f4f8a480",children:"زمان مطالعه: ۵ دقیقه"})]})]}),(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 guide-article-content",children:[(0,e.jsx)("p",{className:"jsx-d0a39f07f4f8a480 guide-intro",children:"گاهی هنگام ورود کارشناسان ما به اکانت شما (به دلیل ورود از آی‌پی یا دستگاه متفاوت)، پلتفرم‌های مایکروسافت، سونی یا اپیک گیمز برای حفظ امنیت، حساب کاربری شما را به‌صورت موقت محدود یا قفل می‌کنند. این محدودیت‌ها کاملاً طبیعی و به‌سادگی قابل رفع هستند و پشتیبانی نوبیکس در تمام مراحل تا تکمیل سفارش همراه شماست."}),(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 info-banner",children:[(0,e.jsxs)("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",className:"jsx-d0a39f07f4f8a480",children:[(0,e.jsx)("circle",{cx:"12",cy:"12",r:"10",className:"jsx-d0a39f07f4f8a480"}),(0,e.jsx)("path",{d:"M12 16v-4",className:"jsx-d0a39f07f4f8a480"}),(0,e.jsx)("path",{d:"M12 8h.01",className:"jsx-d0a39f07f4f8a480"})]}),(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480",children:[(0,e.jsx)("strong",{className:"jsx-d0a39f07f4f8a480",children:"چرا محدودیت ایجاد می‌شود؟"}),(0,e.jsx)("p",{className:"jsx-d0a39f07f4f8a480",children:"پلتفرم‌های بازی، ورود از کشورها یا دستگاه‌های جدید را فعالیتی غیرمعمول تلقی کرده و درخواست تایید هویت می‌کنند. این اقدام صرفاً برای اطمینان از این است که خود صاحب حساب اجازه این دسترسی را داده است."})]})]}),(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 guide-content",children:[(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 platform-section",children:[(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 platform-header",children:[(0,e.jsx)("img",{src:"/icons/epic.svg",alt:"Epic Games",width:24,height:24,className:"jsx-d0a39f07f4f8a480"}),(0,e.jsx)("h2",{className:"jsx-d0a39f07f4f8a480",children:"رفع محدودیت Epic Games"})]}),(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 restriction-type",children:[(0,e.jsx)("h3",{className:"jsx-d0a39f07f4f8a480",children:'۱. محدودیت "New Device Login"'}),(0,e.jsx)("p",{className:"jsx-d0a39f07f4f8a480",children:"اگر با پیام تایید دستگاه جدید روبه‌رو شدید:"}),(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 steps-compact",children:[(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 step-compact",children:[(0,e.jsx)("span",{className:"jsx-d0a39f07f4f8a480 step-num",children:"۱"}),(0,e.jsx)("span",{className:"jsx-d0a39f07f4f8a480",children:"صندوق ورودی ایمیل خود را باز کنید."})]}),(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 step-compact",children:[(0,e.jsx)("span",{className:"jsx-d0a39f07f4f8a480 step-num",children:"۲"}),(0,e.jsx)("span",{className:"jsx-d0a39f07f4f8a480",children:'ایمیلی از طرف Epic Games با عنوان "Verify your device" را پیدا کنید.'})]}),(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 step-compact",children:[(0,e.jsx)("span",{className:"jsx-d0a39f07f4f8a480 step-num",children:"۳"}),(0,e.jsx)("span",{className:"jsx-d0a39f07f4f8a480",children:'روی دکمه "Yes, it\'s me" یا لینک تایید کلیک کنید تا محدودیت ورود برطرف شود.'})]})]})]}),(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 restriction-type",children:[(0,e.jsx)("h3",{className:"jsx-d0a39f07f4f8a480",children:"۲. محدودیت قفل اکانت (Account Locked)"}),(0,e.jsx)("p",{className:"jsx-d0a39f07f4f8a480",children:"اگر حساب به دلیل تلاش‌های متعدد برای ورود قفل شده است:"}),(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 steps-compact",children:[(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 step-compact",children:[(0,e.jsx)("span",{className:"jsx-d0a39f07f4f8a480 step-num",children:"۱"}),(0,e.jsxs)("span",{className:"jsx-d0a39f07f4f8a480",children:["به بخش ",(0,e.jsx)("a",{href:"https://www.epicgames.com/account/password",target:"_blank",rel:"noopener noreferrer",className:"jsx-d0a39f07f4f8a480",children:"بازیابی رمز عبور اپیک گیمز"})," مراجعه کنید."]})]}),(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 step-compact",children:[(0,e.jsx)("span",{className:"jsx-d0a39f07f4f8a480 step-num",children:"۲"}),(0,e.jsx)("span",{className:"jsx-d0a39f07f4f8a480",children:"ایمیل خود را وارد کرده و لینک تغییر رمز عبور را دریافت کنید."})]}),(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 step-compact",children:[(0,e.jsx)("span",{className:"jsx-d0a39f07f4f8a480 step-num",children:"۳"}),(0,e.jsx)("span",{className:"jsx-d0a39f07f4f8a480",children:"پس از تغییر رمز عبور، حساب شما به‌صورت خودکار از حالت قفل خارج می‌شود."})]})]})]})]}),(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 platform-section",children:[(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 platform-header",children:[(0,e.jsx)("img",{src:"/icons/xbox.svg",alt:"Xbox",width:24,height:24,className:"jsx-d0a39f07f4f8a480"}),(0,e.jsx)("h2",{className:"jsx-d0a39f07f4f8a480",children:"رفع محدودیت Xbox (مایکروسافت)"})]}),(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 restriction-type",children:[(0,e.jsx)("h3",{className:"jsx-d0a39f07f4f8a480",children:"۱. محدودیت فعالیت مشکوک (Unusual Activity)"}),(0,e.jsx)("p",{className:"jsx-d0a39f07f4f8a480",children:'اگر پیام "We\'ve noticed some unusual activity" را دریافت کردید:'}),(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 steps-compact",children:[(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 step-compact",children:[(0,e.jsx)("span",{className:"jsx-d0a39f07f4f8a480 step-num",children:"۱"}),(0,e.jsx)("span",{className:"jsx-d0a39f07f4f8a480",children:'روی گزینه "Verify my identity" کلیک کنید.'})]}),(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 step-compact",children:[(0,e.jsx)("span",{className:"jsx-d0a39f07f4f8a480 step-num",children:"۲"}),(0,e.jsx)("span",{className:"jsx-d0a39f07f4f8a480",children:"کد تایید ارسال‌شده به ایمیل پشتیبان یا شماره موبایل متصل به حساب را وارد کنید."})]}),(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 step-compact",children:[(0,e.jsx)("span",{className:"jsx-d0a39f07f4f8a480 step-num",children:"۳"}),(0,e.jsx)("span",{className:"jsx-d0a39f07f4f8a480",children:"در صورت درخواست سیستم، رمز عبور خود را به‌روزرسانی کنید."})]})]})]}),(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 restriction-type",children:[(0,e.jsx)("h3",{className:"jsx-d0a39f07f4f8a480",children:"۲. غیرفعال‌سازی Passkey"}),(0,e.jsx)("p",{className:"jsx-d0a39f07f4f8a480",children:"اگر Passkey ویندوز یا مایکروسافت مانع ورود کارشناسان ما شده است:"}),(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 steps-compact",children:[(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 step-compact",children:[(0,e.jsx)("span",{className:"jsx-d0a39f07f4f8a480 step-num",children:"۱"}),(0,e.jsxs)("span",{className:"jsx-d0a39f07f4f8a480",children:["به آدرس ",(0,e.jsx)("a",{href:"https://account.microsoft.com/security",target:"_blank",rel:"noopener noreferrer",className:"jsx-d0a39f07f4f8a480",children:"account.microsoft.com/security"})," بروید."]})]}),(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 step-compact",children:[(0,e.jsx)("span",{className:"jsx-d0a39f07f4f8a480 step-num",children:"۲"}),(0,e.jsx)("span",{className:"jsx-d0a39f07f4f8a480",children:"وارد بخش Advanced security options شوید."})]}),(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 step-compact",children:[(0,e.jsx)("span",{className:"jsx-d0a39f07f4f8a480 step-num",children:"۳"}),(0,e.jsx)("span",{className:"jsx-d0a39f07f4f8a480",children:"گزینه Passkey را به‌طور موقت غیرفعال یا حذف کنید تا ورود عادی امکان‌پذیر شود."})]})]})]})]}),(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 platform-section",children:[(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 platform-header",children:[(0,e.jsx)("img",{src:"/icons/playstation.svg",alt:"PlayStation",width:24,height:24,className:"jsx-d0a39f07f4f8a480"}),(0,e.jsx)("h2",{className:"jsx-d0a39f07f4f8a480",children:"رفع محدودیت PlayStation"})]}),(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 restriction-type",children:[(0,e.jsx)("h3",{className:"jsx-d0a39f07f4f8a480",children:"۱. تایید لاگین دستگاه جدید (Sign-in Verification)"}),(0,e.jsx)("p",{className:"jsx-d0a39f07f4f8a480",children:"اگر هنگام ورود، سیستم درخواست کد تایید هویت کرد:"}),(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 steps-compact",children:[(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 step-compact",children:[(0,e.jsx)("span",{className:"jsx-d0a39f07f4f8a480 step-num",children:"۱"}),(0,e.jsx)("span",{className:"jsx-d0a39f07f4f8a480",children:"کد ارسال‌شده به ایمیل یا موبایل خود را در اسرع وقت برای پشتیبانی نوبیکس بفرستید."})]}),(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 step-compact",children:[(0,e.jsx)("span",{className:"jsx-d0a39f07f4f8a480 step-num",children:"۲"}),(0,e.jsx)("span",{className:"jsx-d0a39f07f4f8a480",children:"دسترسی ورود دستگاه جدید را از طریق ایمیل خود تایید (Authorize) کنید."})]})]})]}),(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 restriction-type",children:[(0,e.jsx)("h3",{className:"jsx-d0a39f07f4f8a480",children:"۲. بازیابی حساب قفل شده (PSN Recovery)"}),(0,e.jsx)("p",{className:"jsx-d0a39f07f4f8a480",children:"اگر حساب شما به دلیل مسائل امنیتی به‌طور کامل مسدود شده است:"}),(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 steps-compact",children:[(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 step-compact",children:[(0,e.jsx)("span",{className:"jsx-d0a39f07f4f8a480 step-num",children:"۱"}),(0,e.jsxs)("span",{className:"jsx-d0a39f07f4f8a480",children:["به ",(0,e.jsx)("a",{href:"https://www.playstation.com/acct/recovery",target:"_blank",rel:"noopener noreferrer",className:"jsx-d0a39f07f4f8a480",children:"صفحه بازیابی و پشتیبانی رسمی سونی"})," مراجعه کنید."]})]}),(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 step-compact",children:[(0,e.jsx)("span",{className:"jsx-d0a39f07f4f8a480 step-num",children:"۲"}),(0,e.jsx)("span",{className:"jsx-d0a39f07f4f8a480",children:"شناسه PSN یا ایمیل حساب خود را وارد کرده و درخواست بازیابی رمز عبور را ثبت کنید."})]})]})]})]})]}),(0,e.jsx)("div",{className:"jsx-d0a39f07f4f8a480 tip-section",children:(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 tip-card",children:[(0,e.jsx)("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",className:"jsx-d0a39f07f4f8a480",children:(0,e.jsx)("path",{d:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",className:"jsx-d0a39f07f4f8a480"})}),(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480",children:[(0,e.jsx)("h4",{className:"jsx-d0a39f07f4f8a480",children:"نکته بسیار مهم برای پیشگیری"}),(0,e.jsx)("p",{className:"jsx-d0a39f07f4f8a480",children:"غیرفعال کردن تایید دو مرحله‌ای (2FA) پیش از ثبت نهایی خرید، احتمال بروز هرگونه قفل یا محدودیت امنیتی در حین سفارش را به‌طور چشمگیری کاهش می‌دهد."}),(0,e.jsx)(i.default,{href:"/guides/disable-2fa",className:"tip-link",children:"مطالعه راهنمای خاموش کردن 2FA"})]})]})}),(0,e.jsxs)("div",{className:"jsx-d0a39f07f4f8a480 guide-footer",children:[(0,e.jsx)("h3",{className:"jsx-d0a39f07f4f8a480",children:"محدودیت حساب همچنان برطرف نشد؟"}),(0,e.jsx)("p",{className:"jsx-d0a39f07f4f8a480",children:"اگر با خطای دیگری مواجه شدید یا نتوانستید قفل حساب خود را باز کنید، کارشناسان نوبیکس تا رفع کامل مشکل و تکمیل سفارش در کنار شما هستند."}),(0,e.jsxs)("a",{href:"https://t.me/Nubixsupport",target:"_blank",rel:"noopener noreferrer",className:"jsx-d0a39f07f4f8a480 support-btn",children:[(0,e.jsx)("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"currentColor",className:"jsx-d0a39f07f4f8a480",children:(0,e.jsx)("path",{d:"M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.242-1.865-.442-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.099.155.232.171.325.016.093.036.305.02.471z",className:"jsx-d0a39f07f4f8a480"})}),"ارتباط با پشتیبانی نوبیکس در تلگرام"]})]})]})]}),(0,e.jsx)(t.default,{})]})})}])}]);