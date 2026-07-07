module.exports=[93695,(a,b,c)=>{b.exports=a.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},71306,(a,b,c)=>{b.exports=a.r(18622)},79847,a=>{a.n(a.i(3343))},9185,a=>{a.n(a.i(29432))},72842,a=>{a.n(a.i(75164))},54897,a=>{a.n(a.i(30106))},56157,a=>{a.n(a.i(18970))},94331,a=>{a.n(a.i(60644))},15988,a=>{a.n(a.i(56952))},25766,a=>{a.n(a.i(77341))},29725,a=>{a.n(a.i(94290))},90833,a=>{a.n(a.i(46994))},5785,a=>{a.n(a.i(90588))},74793,a=>{a.n(a.i(33169))},85826,a=>{a.n(a.i(37111))},21565,a=>{a.n(a.i(41763))},65911,a=>{a.n(a.i(8950))},25128,a=>{a.n(a.i(91562))},40781,a=>{a.n(a.i(49670))},69411,a=>{a.n(a.i(75700))},63081,a=>{a.n(a.i(276))},62837,a=>{a.n(a.i(40795))},34607,a=>{a.n(a.i(11614))},96338,a=>{a.n(a.i(21751))},50642,a=>{a.n(a.i(12213))},32242,a=>{a.n(a.i(22693))},88530,a=>{a.n(a.i(10531))},8583,a=>{a.n(a.i(1082))},75734,a=>{a.n(a.i(98175))},70408,a=>{a.n(a.i(9095))},22922,a=>{a.n(a.i(96772))},78294,a=>{a.n(a.i(71717))},16625,a=>{a.n(a.i(85034))},88648,a=>{a.n(a.i(68113))},51914,a=>{a.n(a.i(66482))},25466,a=>{a.n(a.i(91505))},71029,(a,b,c)=>{"use strict";c._=function(a){return a&&a.__esModule?a:{default:a}}},47452,a=>{"use strict";a.s(["default",()=>b]);let b=(0,a.i(11857).registerClientReference)(function(){throw Error("Attempted to call the default export of [project]/app/faq/HelpfulnessWidget.jsx <module evaluation> from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"[project]/app/faq/HelpfulnessWidget.jsx <module evaluation>","default")},30722,a=>{"use strict";a.s(["default",()=>b]);let b=(0,a.i(11857).registerClientReference)(function(){throw Error("Attempted to call the default export of [project]/app/faq/HelpfulnessWidget.jsx from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"[project]/app/faq/HelpfulnessWidget.jsx","default")},7637,a=>{"use strict";a.i(47452);var b=a.i(30722);a.n(b)},60112,a=>{"use strict";var b=a.i(7997);a.i(70396);var c=a.i(73727),d=a.i(95936),e=a.i(58452),f=a.i(7637),g=a.i(87559);async function h({params:a}){let{slug:b}=await a,c=g.faqItems.find(a=>a.slug===b);return c?{title:c.question,description:c.answer,alternates:{canonical:`/faq/${b}`},openGraph:{title:c.question,description:c.answer,url:`https://nubixshop.ir/faq/${b}`,type:"article",images:[{url:"https://nubixshop.ir/og-image.webp",alt:"سوالات متداول نوبیکس شاپ"}]},twitter:{card:"summary_large_image",title:c.question,description:c.answer,images:["https://nubixshop.ir/og-image.webp"]}}:{title:"مقاله یافت نشد",robots:{index:!1}}}async function i({params:a}){let{slug:h}=await a,j=g.faqItems.find(a=>a.slug===h);j||(0,c.notFound)();let k={"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"نوبیکس شاپ",item:"https://nubixshop.ir"},{"@type":"ListItem",position:2,name:"مرکز پشتیبانی",item:"https://nubixshop.ir/faq"},{"@type":"ListItem",position:3,name:j.question,item:`https://nubixshop.ir/faq/${h}`}]},l=g.faqItems.filter(a=>a.slug!==j.slug).slice(0,2);return(0,b.jsx)(e.default,{title:j.question,subtitle:`بخش سوالات متداول • دسته‌بندی ${j.category}`,activeSection:"faq",children:(0,b.jsxs)("div",{className:"faq-article-container",children:[(0,b.jsx)("script",{type:"application/ld+json",dangerouslySetInnerHTML:{__html:JSON.stringify(k)}}),(0,b.jsx)("style",{children:`
          .faq-article-container {
            display: flex;
            flex-direction: column;
            gap: 24px;
            width: 100%;
          }
          
          /* Breadcrumbs */
          .faq-breadcrumbs {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            color: var(--muted);
          }
          
          .faq-breadcrumbs a {
            color: var(--muted);
            text-decoration: none;
            transition: color 0.2s;
          }
          
          .faq-breadcrumbs a:hover {
            color: var(--primary);
          }
          
          .faq-breadcrumb-separator {
            opacity: 0.6;
          }
          
          /* Main Article Box */
          .faq-article-box {
            background: var(--card);
            border: 1px solid var(--line);
            border-radius: 24px;
            overflow: hidden;
            box-shadow: var(--shadow);
          }
          
          .faq-article-banner {
            height: 180px;
            background: linear-gradient(135deg, var(--primary), var(--primary-2));
            position: relative;
            padding: 40px;
            display: flex;
            align-items: flex-end;
            overflow: hidden;
          }
          
          .faq-article-banner::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 60%);
            pointer-events: none;
          }
          
          .faq-article-banner-icon {
            position: absolute;
            top: 20px;
            left: 20px;
            font-size: 80px;
            opacity: 0.15;
            user-select: none;
          }
          
          .faq-article-meta {
            display: flex;
            flex-direction: column;
            gap: 8px;
            z-index: 1;
          }
          
          .faq-article-tag {
            align-self: flex-start;
            font-size: 12px;
            font-weight: 800;
            color: #fff;
            background: rgba(255, 255, 255, 0.2);
            padding: 4px 12px;
            border-radius: 99px;
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
          }
          
          .faq-article-banner .page-banner-title {
            margin: 0;
            font-size: 28px;
            font-weight: 900;
            color: #fff;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .faq-article-info-bar {
            display: flex;
            gap: 20px;
            padding: 16px 40px;
            background: rgba(255, 255, 255, 0.02);
            border-bottom: 1px solid var(--line);
            font-size: 13px;
            color: var(--muted);
          }
          
          .faq-info-item {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          
          .faq-article-content {
            padding: 40px;
            color: var(--text);
            font-size: 16px;
            line-height: 1.9;
          }
          
          .faq-article-content :global(h3) {
            font-size: 20px;
            font-weight: 800;
            margin: 32px 0 16px;
            color: var(--text);
            border-bottom: 1px solid var(--line);
            padding-bottom: 10px;
          }
          
          .faq-article-content :global(p) {
            margin: 0 0 20px;
            color: var(--text);
            opacity: 0.95;
          }
          
          .faq-article-content :global(ul), .faq-article-content :global(ol) {
            margin: 0 0 24px;
            padding-inline-start: 24px;
          }
          
          .faq-article-content :global(li) {
            margin-bottom: 8px;
            color: var(--text);
            opacity: 0.95;
          }
          
          .faq-article-content :global(strong) {
            color: var(--text);
            font-weight: 700;
          }
          
          /* Related Articles */
          .faq-related-section {
            margin-top: 24px;
          }
          
          .faq-related-title {
            font-size: 16px;
            font-weight: 800;
            color: var(--text);
            margin: 0 0 16px;
          }
          
          .faq-related-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          
          .faq-related-card {
            background: var(--card);
            border: 1px solid var(--line);
            border-radius: 18px;
            padding: 20px;
            text-decoration: none;
            color: var(--text);
            transition: all 0.25s ease;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          
          .faq-related-card:hover {
            transform: translateY(-3px);
            border-color: var(--primary);
            box-shadow: var(--shadow);
          }
          
          .faq-related-card h4 {
            margin: 0;
            font-size: 15px;
            font-weight: 800;
            color: var(--text);
            transition: color 0.2s;
          }
          
          .faq-related-card:hover h4 {
            color: var(--primary);
          }
          
          .faq-related-desc {
            font-size: 13px;
            color: var(--muted);
            line-height: 1.6;
            margin: 0;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          @media (max-width: 768px) {
            .faq-article-banner {
              height: 140px;
              padding: 24px;
            }
            .faq-article-banner .page-banner-title {
              font-size: 20px;
            }
            .faq-article-info-bar {
              padding: 12px 24px;
              flex-wrap: wrap;
              gap: 12px;
            }
            .faq-article-content {
              padding: 24px;
              font-size: 15px;
            }
            .faq-related-grid {
              grid-template-columns: 1fr;
              gap: 12px;
            }
          }
        `}),(0,b.jsxs)("div",{className:"faq-breadcrumbs",children:[(0,b.jsx)(d.default,{href:"/",children:"نوبیکس شاپ"}),(0,b.jsx)("span",{className:"faq-breadcrumb-separator",children:"/"}),(0,b.jsx)(d.default,{href:"/faq",children:"مرکز پشتیبانی"}),(0,b.jsx)("span",{className:"faq-breadcrumb-separator",children:"/"}),(0,b.jsx)("span",{style:{color:"var(--text)",fontWeight:600},children:j.question})]}),(0,b.jsxs)("article",{className:"faq-article-box",children:[(0,b.jsxs)("div",{className:"faq-article-banner",children:[(0,b.jsx)("span",{className:"faq-article-banner-icon",children:j.icon}),(0,b.jsxs)("div",{className:"faq-article-meta",children:[(0,b.jsx)("span",{className:"faq-article-tag",children:j.category}),(0,b.jsx)("h2",{className:"page-banner-title",children:j.question})]})]}),(0,b.jsxs)("div",{className:"faq-article-info-bar",children:[(0,b.jsxs)("div",{className:"faq-info-item",children:[(0,b.jsx)("span",{children:"✍️"}),(0,b.jsxs)("span",{children:["نویسنده: ",j.author]})]}),(0,b.jsxs)("div",{className:"faq-info-item",children:[(0,b.jsx)("span",{children:"📅"}),(0,b.jsxs)("span",{children:["بروزرسانی: ",j.date]})]}),(0,b.jsxs)("div",{className:"faq-info-item",children:[(0,b.jsx)("span",{children:"⏱️"}),(0,b.jsxs)("span",{children:["زمان مطالعه: ",j.readTime]})]})]}),(0,b.jsx)("div",{className:"faq-article-content",dangerouslySetInnerHTML:{__html:j.content}})]}),(0,b.jsx)(f.default,{}),(0,b.jsxs)("div",{className:"faq-related-section",children:[(0,b.jsx)("h3",{className:"faq-related-title",children:"شاید برای شما مفید باشد:"}),(0,b.jsx)("div",{className:"faq-related-grid",children:l.map(a=>(0,b.jsxs)(d.default,{href:`/faq/${a.slug}`,className:"faq-related-card",children:[(0,b.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:[(0,b.jsx)("span",{style:{fontSize:"18px"},children:a.icon}),(0,b.jsx)("h4",{children:a.question})]}),(0,b.jsx)("p",{className:"faq-related-desc",children:a.answer})]},a.slug))})]})]})})}a.s(["default",0,i,"generateMetadata",0,h,"generateStaticParams",0,function(){return g.faqItems.map(a=>({slug:a.slug}))}])},50862,a=>{a.n(a.i(60112))}];

//# sourceMappingURL=%5Broot-of-the-server%5D__1zm-rdn._.js.map