module.exports=[93695,(a,b,c)=>{b.exports=a.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},71306,(a,b,c)=>{b.exports=a.r(18622)},79847,a=>{a.n(a.i(3343))},9185,a=>{a.n(a.i(29432))},72842,a=>{a.n(a.i(75164))},54897,a=>{a.n(a.i(30106))},56157,a=>{a.n(a.i(18970))},94331,a=>{a.n(a.i(60644))},15988,a=>{a.n(a.i(56952))},25766,a=>{a.n(a.i(77341))},29725,a=>{a.n(a.i(94290))},90833,a=>{a.n(a.i(46994))},5785,a=>{a.n(a.i(90588))},74793,a=>{a.n(a.i(33169))},85826,a=>{a.n(a.i(37111))},21565,a=>{a.n(a.i(41763))},65911,a=>{a.n(a.i(8950))},25128,a=>{a.n(a.i(91562))},40781,a=>{a.n(a.i(49670))},69411,a=>{a.n(a.i(75700))},63081,a=>{a.n(a.i(276))},62837,a=>{a.n(a.i(40795))},34607,a=>{a.n(a.i(11614))},96338,a=>{a.n(a.i(21751))},50642,a=>{a.n(a.i(12213))},32242,a=>{a.n(a.i(22693))},88530,a=>{a.n(a.i(10531))},8583,a=>{a.n(a.i(1082))},75734,a=>{a.n(a.i(98175))},70408,a=>{a.n(a.i(9095))},22922,a=>{a.n(a.i(96772))},78294,a=>{a.n(a.i(71717))},16625,a=>{a.n(a.i(85034))},88648,a=>{a.n(a.i(68113))},51914,a=>{a.n(a.i(66482))},25466,a=>{a.n(a.i(91505))},71029,(a,b,c)=>{"use strict";c._=function(a){return a&&a.__esModule?a:{default:a}}},47452,a=>{"use strict";a.s(["default",()=>b]);let b=(0,a.i(11857).registerClientReference)(function(){throw Error("Attempted to call the default export of [project]/app/faq/HelpfulnessWidget.jsx <module evaluation> from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"[project]/app/faq/HelpfulnessWidget.jsx <module evaluation>","default")},30722,a=>{"use strict";a.s(["default",()=>b]);let b=(0,a.i(11857).registerClientReference)(function(){throw Error("Attempted to call the default export of [project]/app/faq/HelpfulnessWidget.jsx from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"[project]/app/faq/HelpfulnessWidget.jsx","default")},7637,a=>{"use strict";a.i(47452);var b=a.i(30722);a.n(b)},36157,a=>{"use strict";var b=a.i(7997),c=a.i(95936),d=a.i(58452),e=a.i(7637),f=a.i(87559);a.s(["default",0,function(){return(0,b.jsx)(d.default,{title:"تماس با ما",subtitle:"تیم پشتیبانی نوبیکس شاپ همواره آماده پاسخگویی به سوالات و پیگیری سفارشات شماست.",activeSection:"contact",children:(0,b.jsxs)("div",{className:"contact-article-container",children:[(0,b.jsx)("style",{children:`
          .contact-article-container {
            display: flex;
            flex-direction: column;
            gap: 24px;
            width: 100%;
          }
          
          .contact-article-box {
            background: var(--card);
            border: 1px solid var(--line);
            border-radius: 24px;
            overflow: hidden;
            box-shadow: var(--shadow);
          }
          
          .contact-article-banner {
            height: 180px;
            background: linear-gradient(135deg, #0088cc, #7c3aed);
            position: relative;
            padding: 40px;
            display: flex;
            align-items: flex-end;
            overflow: hidden;
          }
          
          .contact-article-banner::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 60%);
            pointer-events: none;
          }
          
          .contact-article-banner-icon {
            position: absolute;
            top: 20px;
            left: 20px;
            font-size: 80px;
            opacity: 0.15;
            user-select: none;
            color: #fff;
          }
          
          .contact-article-meta {
            display: flex;
            flex-direction: column;
            gap: 8px;
            z-index: 1;
          }
          
          .contact-article-tag {
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
          
          .contact-article-banner .page-banner-title {
            margin: 0;
            font-size: 28px;
            font-weight: 900;
            color: #fff;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .contact-article-info-bar {
            display: flex;
            gap: 20px;
            padding: 16px 40px;
            background: rgba(255, 255, 255, 0.02);
            border-bottom: 1px solid var(--line);
            font-size: 13px;
            color: var(--muted);
          }
          
          .contact-info-item {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          
          .contact-article-content {
            padding: 40px;
            color: var(--text);
            font-size: 16px;
            line-height: 1.9;
          }
          
          .contact-intro {
            font-size: 16px;
            color: var(--text);
            opacity: 0.95;
            margin-bottom: 32px;
          }
          
          /* Channels Grid */
          .contact-channels-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 20px;
            margin-bottom: 36px;
          }
          
          .contact-channel-card {
            background: var(--bg);
            border: 1px solid var(--line);
            border-radius: 20px;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            transition: all 0.25s ease;
          }
          
          .contact-channel-card:hover {
            transform: translateY(-3px);
            border-color: var(--primary);
            box-shadow: 0 8px 20px rgba(124, 58, 237, 0.05);
          }
          
          .contact-channel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .contact-channel-icon {
            width: 46px;
            height: 46px;
            border-radius: 12px;
            background: var(--card);
            color: var(--primary);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid var(--line);
          }
          
          .contact-channel-tag {
            font-size: 11px;
            color: var(--primary);
            background: rgba(124, 58, 237, 0.06);
            padding: 4px 10px;
            border-radius: 99px;
            font-weight: 800;
          }
          
          .contact-channel-card h3 {
            margin: 4px 0 0;
            font-size: 17px;
            font-weight: 800;
            color: var(--text);
          }
          
          .contact-channel-card p {
            margin: 0;
            font-size: 13px;
            color: var(--muted);
            line-height: 1.6;
            flex: 1;
          }
          
          .contact-channel-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 10px 16px;
            border-radius: 12px;
            background: var(--card);
            border: 1px solid var(--line);
            color: var(--text);
            text-decoration: none;
            font-size: 14px;
            font-weight: 700;
            transition: all 0.2s ease;
            text-align: center;
            margin-top: 8px;
          }
          
          .contact-channel-btn:hover {
            background: var(--primary);
            color: #fff;
            border-color: var(--primary);
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.15);
          }
          
          /* Office Locations */
          .contact-offices-title {
            font-size: 18px;
            font-weight: 800;
            color: var(--text);
            margin: 0 0 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--line);
          }
          
          .contact-offices-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          
          .contact-office-card {
            background: var(--bg);
            border: 1px solid var(--line);
            border-radius: 20px;
            padding: 24px;
            display: flex;
            gap: 16px;
            align-items: flex-start;
          }
          
          .contact-office-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            background: var(--card);
            color: var(--primary);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            border: 1px solid var(--line);
          }
          
          .contact-office-details h4 {
            margin: 0 0 6px 0;
            font-size: 16px;
            font-weight: 800;
            color: var(--text);
          }
          
          .contact-office-details p {
            margin: 0;
            font-size: 14px;
            color: var(--muted);
            line-height: 1.6;
          }
          
          @media (max-width: 768px) {
            .contact-article-banner {
              height: 140px;
              padding: 24px;
            }
            .contact-article-banner .page-banner-title {
              font-size: 22px;
            }
            .contact-article-info-bar {
              padding: 12px 24px;
              flex-wrap: wrap;
              gap: 12px;
            }
            .contact-article-content {
              padding: 24px;
            }
            .contact-offices-grid {
              grid-template-columns: 1fr;
              gap: 12px;
            }
            .contact-office-card {
              padding: 16px;
            }
          }
        `}),(0,b.jsxs)("div",{className:"contact-article-box",children:[(0,b.jsxs)("div",{className:"contact-article-banner",children:[(0,b.jsx)("span",{className:"contact-article-banner-icon",children:"📞"}),(0,b.jsxs)("div",{className:"contact-article-meta",children:[(0,b.jsx)("span",{className:"contact-article-tag",children:"ارتباط با ما"}),(0,b.jsx)("h2",{className:"page-banner-title",children:"راه‌های ارتباطی و آدرس شعب نوبیکس"})]})]}),(0,b.jsxs)("div",{className:"contact-article-info-bar",children:[(0,b.jsxs)("div",{className:"contact-info-item",children:[(0,b.jsx)("span",{children:"✍️"}),(0,b.jsx)("span",{children:"تنظیم‌کننده: روابط عمومی نوبیکس"})]}),(0,b.jsxs)("div",{className:"contact-info-item",children:[(0,b.jsx)("span",{children:"📅"}),(0,b.jsx)("span",{children:"بروزرسانی: ۱۱ تیر ۱۴۰۵"})]}),(0,b.jsxs)("div",{className:"contact-info-item",children:[(0,b.jsx)("span",{children:"⏱️"}),(0,b.jsx)("span",{children:"زمان مطالعه: ۳ دقیقه"})]})]}),(0,b.jsxs)("div",{className:"contact-article-content",children:[(0,b.jsx)("p",{className:"contact-intro",children:"هدف ما ارائه خدماتی بی‌نقص است، اما در صورت بروز هرگونه مشکل، ابهام و یا نیاز به پیگیری خرید، می‌توانید از طریق کانال‌های ارتباطی زیر با کارشناسان پشتیبانی نوبیکس شاپ در ارتباط باشید."}),(0,b.jsx)("div",{className:"contact-channels-grid",children:f.contactChannels.map(a=>(0,b.jsxs)("div",{className:"contact-channel-card",children:[(0,b.jsxs)("div",{className:"contact-channel-header",children:[(0,b.jsx)("div",{className:"contact-channel-icon",children:a.icon}),(0,b.jsx)("span",{className:"contact-channel-tag",children:a.tag})]}),(0,b.jsx)("h3",{children:a.title}),(0,b.jsx)("p",{children:a.detail}),(0,b.jsx)(c.default,{href:"پشتیبانی تلفنی"===a.title?`tel:${a.value.replace(/\s+/g,"")}`:"پشتیبانی تلگرام"===a.title?"https://t.me/Nubixsupport":"ایمیل"===a.title?`mailto:${a.value}`:"#",target:"پشتیبانی تلگرام"===a.title?"_blank":void 0,className:"contact-channel-btn",children:"پشتیبانی تلفنی"===a.title?"تماس تلفنی مستقیم":"پشتیبانی تلگرام"===a.title?"ارسال پیام در تلگرام":"ایمیل"===a.title?"ارسال ایمیل رسمی":"مشاهده"})]},a.title))}),(0,b.jsx)("h3",{className:"contact-offices-title",children:"شعب و دفاتر رسمی نوبیکس شاپ"}),(0,b.jsx)("div",{className:"contact-offices-grid",children:f.officeLocations.map(a=>(0,b.jsxs)("div",{className:"contact-office-card",children:[(0,b.jsx)("div",{className:"contact-office-icon",children:a.icon}),(0,b.jsxs)("div",{className:"contact-office-details",children:[(0,b.jsx)("h4",{children:a.title}),(0,b.jsx)("p",{children:a.description})]})]},a.title))})]})]}),(0,b.jsx)(e.default,{})]})})},"metadata",0,{title:"تماس با نوبیکس شاپ",alternates:{canonical:"/faq/contact"},description:"راه‌های ارتباطی، پشتیبانی تلفنی، آدرس آیدی رسمی تلگرام و اطلاعات شعب نوبیکس شاپ."}])},14217,a=>{a.n(a.i(36157))}];

//# sourceMappingURL=%5Broot-of-the-server%5D__0he8luh._.js.map