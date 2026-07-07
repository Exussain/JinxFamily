module.exports=[62307,a=>{"use strict";let b={"fortnite-freediver":"/products/freediver.webp","fortnite-crew-pack":"/products/crewpack.webp","fortnite-starter-pack":"/products/starterpack.webp","fortnite-battle-pass":"/products/battlepass.webp","fortnite-music-pass":"/products/musicpass.webp","gift-battle-pass":"/products/battlepass.webp","fortnite-save-the-world":"/products/savetheworld.webp","fortnite-glided-elite-pack":"/products/pack_glided_elites.webp","v-bucks":"/products/product_vbucks.webp","lego-starter-pack":"/products/lego_starter_pack.webp","pack-agency-renegades":"/products/pack_agency_renegades.webp","agency-renegades":"/products/pack_agency_renegades.webp","pack-frozen-legends":"/products/pack_frozen_legends.webp","frozen-legends":"/products/pack_frozen_legends.webp","pack-polar-legends":"/products/pack_polar_legends.webp","polar-legends":"/products/pack_polar_legends.webp","spotify-subscription":"/products/spotify.webp","chatgpt-subscription":"/products/chatgpt.webp","gemini-subscription":"/products/gemini.webp","change-region-turkey":"/products/change-region-turkey.webp"};function c(a){return"string"!=typeof a?"":a.replace(/\.(webp|png|jpe?g|svg)$/i,"")}function d(a){if("string"!=typeof a||!a.startsWith("/media/"))return a;let b="".replace(/\/+$/,"");return b?`${b}${a}`:a}a.s(["resolveProductImage",0,function(a={}){let e="string"==typeof a.slug?a.slug.trim().toLowerCase():"",f=e?b[e]:"",g=a.image_url||a.imageUrl||a.image||a.imageSrc||f||"",h=a.image_base||a.imageBase||("string"==typeof g&&g.startsWith("/")?c(g):""),i="string"==typeof g&&g.length>0?d(g):"string"==typeof h&&/\.[a-z0-9]+$/i.test(h)?d(h):"";return{imageBase:"string"==typeof h&&h.length>0&&!/\.[a-z0-9]+$/i.test(h)?h:"string"==typeof i&&i.startsWith("/")?c(i):"",imageSrc:i}}])},76194,a=>{"use strict";var b=a.i(87924),c=a.i(71987);let d=/\.webp(?:[?#].*)?$/i,e=/^(https?:)?\/\//i;a.s(["default",0,function({src:a,alt:f,base:g,fit:h="cover",eager:i=!1}){let j=a||(g?`${g}.webp`:null);if(!j)return null;let k=d.test(j);return e.test(j)?(0,b.jsx)("img",{src:j,alt:f,loading:i?"eager":"lazy",fetchPriority:i?"high":void 0,decoding:"async",style:{width:"100%",height:"100%",objectFit:h},draggable:"false"}):(0,b.jsx)(c.default,{src:j,alt:f,fill:!0,sizes:"(max-width: 640px) 100vw, 33vw",quality:95,unoptimized:k,priority:i,style:{objectFit:h}})}])},8975,a=>{"use strict";var b=a.i(87924),c=a.i(31626),d=a.i(72131);a.s(["default",0,function(){let[a,e]=(0,d.useState)(null);return(0,b.jsxs)("div",{className:"jsx-d68c3f20f7facd4c helpfulness-widget",children:[(0,b.jsx)(c.default,{id:"d68c3f20f7facd4c",children:".helpfulness-widget.jsx-d68c3f20f7facd4c{border:1px dashed var(--line);background:#ffffff05;border-radius:20px;justify-content:space-between;align-items:center;gap:20px;margin-top:40px;padding:24px;transition:all .3s;display:flex}.helpfulness-title.jsx-d68c3f20f7facd4c{color:var(--text);margin:0;font-size:15px;font-weight:800}.helpfulness-buttons.jsx-d68c3f20f7facd4c{gap:12px;display:flex}.help-btn.jsx-d68c3f20f7facd4c{cursor:pointer;background:var(--card);border:1px solid var(--line);color:var(--muted);border-radius:12px;align-items:center;gap:8px;padding:8px 16px;font-family:inherit;font-size:13px;font-weight:700;transition:all .25s;display:flex}.help-btn.jsx-d68c3f20f7facd4c:hover{border-color:var(--primary);color:var(--primary);transform:translateY(-1px)}.help-btn.yes.jsx-d68c3f20f7facd4c:hover{color:#10b981;background:#10b98114;border-color:#10b981}.help-btn.no.jsx-d68c3f20f7facd4c:hover{color:#ef4444;background:#ef444414;border-color:#ef4444}.thank-you-msg.jsx-d68c3f20f7facd4c{color:#10b981;align-items:center;gap:8px;font-size:14px;font-weight:700;animation:.3s forwards slideUp;display:flex}@keyframes slideUp{0%{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}@media (width<=640px){.helpfulness-widget.jsx-d68c3f20f7facd4c{text-align:center;flex-direction:column;align-items:stretch;gap:16px}.helpfulness-buttons.jsx-d68c3f20f7facd4c{justify-content:center}}"}),null===a?(0,b.jsxs)(b.Fragment,{children:[(0,b.jsx)("h4",{className:"jsx-d68c3f20f7facd4c helpfulness-title",children:"آیا این مقاله آموزشی مفید بود؟"}),(0,b.jsxs)("div",{className:"jsx-d68c3f20f7facd4c helpfulness-buttons",children:[(0,b.jsxs)("button",{onClick:()=>e("yes"),className:"jsx-d68c3f20f7facd4c help-btn yes",children:[(0,b.jsx)("span",{className:"jsx-d68c3f20f7facd4c",children:"👍"})," بله، مفید بود"]}),(0,b.jsxs)("button",{onClick:()=>e("no"),className:"jsx-d68c3f20f7facd4c help-btn no",children:[(0,b.jsx)("span",{className:"jsx-d68c3f20f7facd4c",children:"👎"})," خیر، کامل نبود"]})]})]}):(0,b.jsxs)("div",{style:{margin:"0 auto"},className:"jsx-d68c3f20f7facd4c thank-you-msg",children:[(0,b.jsx)("span",{className:"jsx-d68c3f20f7facd4c",children:"💖"}),"yes"===a?"خوشحالیم که این مقاله برایتان مفید بوده است! سپاس از بازخورد شما.":"ممنون از بازخورد شما. تلاش می‌کنیم این راهنما را در آینده بهبود ببخشیم."]})]})}])},93398,a=>{"use strict";var b=a.i(87924),c=a.i(71987),d=a.i(38246),e=a.i(85254),f=a.i(72131);let g=[{title:"راهنما و پشتیبانی",items:[{id:"faq",label:"سوالات متداول",href:"/faq"},{id:"about",label:"درباره نوبیکس",href:"/faq/about"},{id:"contact",label:"تماس با ما",href:"/faq/contact"},{id:"how-to-buy",label:"راهنمای خرید",href:"/faq/how-to-buy"}]},{title:"قوانین و حریم خصوصی",items:[{id:"rules",label:"قوانین و مقررات",href:"/faq/rules"},{id:"privacy",label:"حریم خصوصی",href:"/faq/privacy"}]},{title:"راهنمای اکانت",items:[{id:"disable-2fa",label:"خاموش کردن ۲FA",href:"/guides/disable-2fa"},{id:"link-unlink",label:"لینک و آنلینک اکانت",href:"/guides/link-unlink"},{id:"remove-restriction",label:"رفع محدودیت حساب",href:"/guides/remove-restriction"}]}],h=[{href:"https://trustseal.enamad.ir/?id=671892&Code=BvHIZx1aeWqVhIlNuGSIySWJ49Yd2uE2",src:"https://trustseal.enamad.ir/logo.aspx?id=671892&Code=BvHIZx1aeWqVhIlNuGSIySWJ49Yd2uE2",alt:"نماد اعتماد الکترونیکی نوبیکس",width:45,height:45},{href:"https://www.zarinpal.com/trustPage/nubixshop.ir",src:"/icons/ZarinPal.svg",alt:"درگاه پرداخت زرین‌پال",width:120,height:40}];a.s(["default",0,function({title:a,subtitle:i,activeSection:j,children:k}){return(0,b.jsxs)(b.Fragment,{children:[(0,b.jsx)(f.Suspense,{fallback:null,children:(0,b.jsx)(e.default,{})}),(0,b.jsxs)("div",{className:"faq-page-wrapper",children:[(0,b.jsx)("style",{children:`
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
        `}),(0,b.jsxs)("div",{className:"faq-container",children:[(0,b.jsx)("header",{className:"faq-header",children:(0,b.jsxs)("div",{className:"faq-header-content",children:[(0,b.jsx)("div",{className:"faq-logo-wrapper",children:(0,b.jsx)(c.default,{src:"/web_logo.webp",width:64,height:64,alt:"لوگوی نوبیکس",priority:!0,quality:95,unoptimized:!0})}),(0,b.jsxs)("div",{className:"faq-header-text",children:[(0,b.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"12px",flexWrap:"wrap"},children:[(0,b.jsx)("span",{style:{margin:0,fontSize:13,fontWeight:800,letterSpacing:1,textTransform:"uppercase",color:"var(--primary)"},children:"Nubix Support Center"}),(0,b.jsxs)("div",{className:"faq-status-badge",children:[(0,b.jsx)("span",{className:"faq-status-dot"}),"مرکز پشتیبانی فعال است"]})]}),(0,b.jsx)("h1",{children:a}),(0,b.jsx)("p",{children:i})]})]})}),(0,b.jsxs)("div",{className:"faq-body-grid",children:[(0,b.jsxs)("aside",{className:"faq-sidebar",children:[(0,b.jsx)("nav",{className:"faq-nav",children:g.map(a=>(0,b.jsxs)("div",{className:"faq-nav-group",children:[(0,b.jsx)("span",{className:"faq-nav-group-title",children:a.title}),a.items.map(a=>{let c=a.id===j;return(0,b.jsx)(d.default,{href:a.href,className:`faq-nav-link ${c?"active":""}`,children:a.label},a.id)})]},a.title))}),(0,b.jsxs)("div",{className:"faq-popular-card",children:[(0,b.jsx)("h3",{className:"faq-trust-title",children:"محصولات پرفروش"}),(0,b.jsxs)("ul",{className:"faq-popular-links",children:[(0,b.jsx)("li",{children:(0,b.jsx)(d.default,{href:"/vbucks",children:"خرید وی باکس فورتنایت"})}),(0,b.jsx)("li",{children:(0,b.jsx)(d.default,{href:"/crewpack",children:"خرید کروپک فورتنایت"})}),(0,b.jsx)("li",{children:(0,b.jsx)(d.default,{href:"/product/chatgpt-subscription",children:"خرید اشتراک ChatGPT"})}),(0,b.jsx)("li",{children:(0,b.jsx)(d.default,{href:"/gemini",children:"خرید اشتراک Gemini"})}),(0,b.jsx)("li",{children:(0,b.jsx)(d.default,{href:"/gta6",children:"پیش‌خرید GTA 6"})})]})]}),(0,b.jsxs)("div",{className:"faq-trust-card",children:[(0,b.jsx)("h3",{className:"faq-trust-title",children:"پرداخت امن و قانونی"}),(0,b.jsx)("div",{className:"faq-trust-logos",children:h.map(a=>a.href.includes("enamad.ir")?(0,b.jsx)("a",{href:a.href,target:"_blank",referrerPolicy:"origin",className:"faq-trust-logo",children:(0,b.jsx)("img",{src:a.src,alt:a.alt,style:{width:a.width,height:a.height,objectFit:"contain",cursor:"pointer"},code:"BvHIZx1aeWqVhIlNuGSIySWJ49Yd2uE2",referrerPolicy:"origin"})},a.alt):(0,b.jsx)(d.default,{href:a.href,target:"_blank",rel:"noreferrer",className:"faq-trust-logo",children:(0,b.jsx)(c.default,{src:a.src,width:a.width,height:a.height,style:{objectFit:"contain"},alt:a.alt})},a.alt))}),(0,b.jsx)("p",{className:"faq-trust-note",children:"تمامی تراکنش‌ها در بستر درگاه بانکی رسمی و معتبر انجام پذیرفته و سفارشات گیمینگ از طریق حساب‌های قانونی خارج از کشور تحویل می‌گردند."})]}),(0,b.jsxs)(d.default,{href:"/",className:"faq-back-home",children:[(0,b.jsxs)("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,b.jsx)("path",{d:"M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"}),(0,b.jsx)("polyline",{points:"9 22 9 12 15 12 15 22"})]}),"بازگشت به فروشگاه"]})]}),(0,b.jsx)("main",{className:"faq-main-content",children:k})]})]})]})]})}])}];

//# sourceMappingURL=_0b_uk_m._.js.map