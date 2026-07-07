module.exports=[93695,(a,b,c)=>{b.exports=a.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},71306,(a,b,c)=>{b.exports=a.r(18622)},79847,a=>{a.n(a.i(3343))},9185,a=>{a.n(a.i(29432))},72842,a=>{a.n(a.i(75164))},54897,a=>{a.n(a.i(30106))},56157,a=>{a.n(a.i(18970))},94331,a=>{a.n(a.i(60644))},15988,a=>{a.n(a.i(56952))},25766,a=>{a.n(a.i(77341))},29725,a=>{a.n(a.i(94290))},90833,a=>{a.n(a.i(46994))},5785,a=>{a.n(a.i(90588))},74793,a=>{a.n(a.i(33169))},85826,a=>{a.n(a.i(37111))},21565,a=>{a.n(a.i(41763))},65911,a=>{a.n(a.i(8950))},25128,a=>{a.n(a.i(91562))},40781,a=>{a.n(a.i(49670))},69411,a=>{a.n(a.i(75700))},63081,a=>{a.n(a.i(276))},62837,a=>{a.n(a.i(40795))},34607,a=>{a.n(a.i(11614))},96338,a=>{a.n(a.i(21751))},50642,a=>{a.n(a.i(12213))},32242,a=>{a.n(a.i(22693))},88530,a=>{a.n(a.i(10531))},8583,a=>{a.n(a.i(1082))},75734,a=>{a.n(a.i(98175))},70408,a=>{a.n(a.i(9095))},22922,a=>{a.n(a.i(96772))},78294,a=>{a.n(a.i(71717))},16625,a=>{a.n(a.i(85034))},88648,a=>{a.n(a.i(68113))},51914,a=>{a.n(a.i(66482))},25466,a=>{a.n(a.i(91505))},71029,(a,b,c)=>{"use strict";c._=function(a){return a&&a.__esModule?a:{default:a}}},47452,a=>{"use strict";a.s(["default",()=>b]);let b=(0,a.i(11857).registerClientReference)(function(){throw Error("Attempted to call the default export of [project]/app/faq/HelpfulnessWidget.jsx <module evaluation> from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"[project]/app/faq/HelpfulnessWidget.jsx <module evaluation>","default")},30722,a=>{"use strict";a.s(["default",()=>b]);let b=(0,a.i(11857).registerClientReference)(function(){throw Error("Attempted to call the default export of [project]/app/faq/HelpfulnessWidget.jsx from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"[project]/app/faq/HelpfulnessWidget.jsx","default")},7637,a=>{"use strict";a.i(47452);var b=a.i(30722);a.n(b)},90801,a=>{"use strict";var b=a.i(7997),c=a.i(58452),d=a.i(7637),e=a.i(87559);a.s(["default",0,function(){return(0,b.jsx)(c.default,{title:"حریم خصوصی",subtitle:"سیاست‌های اصولی نوبیکس شاپ در نحوه نگهداری، رمزنگاری و حفاظت از اطلاعات کاربران.",activeSection:"privacy",children:(0,b.jsxs)("div",{className:"privacy-article-container",children:[(0,b.jsx)("style",{children:`
          .privacy-article-container {
            display: flex;
            flex-direction: column;
            gap: 24px;
            width: 100%;
          }
          
          .privacy-article-box {
            background: var(--card);
            border: 1px solid var(--line);
            border-radius: 24px;
            overflow: hidden;
            box-shadow: var(--shadow);
          }
          
          .privacy-article-banner {
            height: 180px;
            background: linear-gradient(135deg, #10b981, #3b82f6);
            position: relative;
            padding: 40px;
            display: flex;
            align-items: flex-end;
            overflow: hidden;
          }
          
          .privacy-article-banner::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 60%);
            pointer-events: none;
          }
          
          .privacy-article-banner-icon {
            position: absolute;
            top: 20px;
            left: 20px;
            font-size: 80px;
            opacity: 0.15;
            user-select: none;
            color: #fff;
          }
          
          .privacy-article-meta {
            display: flex;
            flex-direction: column;
            gap: 8px;
            z-index: 1;
          }
          
          .privacy-article-tag {
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
          
          .privacy-article-banner .page-banner-title {
            margin: 0;
            font-size: 28px;
            font-weight: 900;
            color: #fff;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .privacy-article-info-bar {
            display: flex;
            gap: 20px;
            padding: 16px 40px;
            background: rgba(255, 255, 255, 0.02);
            border-bottom: 1px solid var(--line);
            font-size: 13px;
            color: var(--muted);
          }
          
          .privacy-info-item {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          
          .privacy-article-content {
            padding: 40px;
            color: var(--text);
            font-size: 16px;
            line-height: 1.9;
          }
          
          .privacy-intro {
            font-size: 16px;
            color: var(--text);
            opacity: 0.95;
            margin-bottom: 32px;
          }
          
          .privacy-list {
            display: flex;
            flex-direction: column;
            gap: 20px;
            margin-bottom: 32px;
          }
          
          .privacy-card {
            background: var(--bg);
            border: 1px solid var(--line);
            border-radius: 18px;
            padding: 24px;
            display: flex;
            gap: 20px;
            align-items: flex-start;
            transition: all 0.25s ease;
          }
          
          .privacy-card:hover {
            border-color: var(--primary);
            box-shadow: 0 4px 12px rgba(0,0,0,0.02);
          }
          
          .privacy-card-icon {
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
          
          .privacy-card-text h3 {
            margin: 0 0 8px 0;
            font-size: 17px;
            font-weight: 800;
            color: var(--text);
          }
          
          .privacy-card-text p {
            margin: 0;
            font-size: 14px;
            color: var(--muted);
            line-height: 1.7;
          }
          
          .privacy-footer-note {
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), var(--bg));
            border: 1px solid rgba(16, 185, 129, 0.3);
            padding: 20px;
            border-radius: 16px;
            color: var(--text);
            font-size: 14px;
            line-height: 1.8;
          }
          
          @media (max-width: 768px) {
            .privacy-article-banner {
              height: 140px;
              padding: 24px;
            }
            .privacy-article-banner .page-banner-title {
              font-size: 22px;
            }
            .privacy-article-info-bar {
              padding: 12px 24px;
              flex-wrap: wrap;
              gap: 12px;
            }
            .privacy-article-content {
              padding: 24px;
            }
            .privacy-card {
              flex-direction: column;
              gap: 12px;
              padding: 16px;
            }
          }
        `}),(0,b.jsxs)("div",{className:"privacy-article-box",children:[(0,b.jsxs)("div",{className:"privacy-article-banner",children:[(0,b.jsx)("span",{className:"privacy-article-banner-icon",children:"🔒"}),(0,b.jsxs)("div",{className:"privacy-article-meta",children:[(0,b.jsx)("span",{className:"privacy-article-tag",children:"امنیت داده‌ها"}),(0,b.jsx)("h2",{className:"page-banner-title",children:"سیاست‌های حفاظت و حریم خصوصی نوبیکس"})]})]}),(0,b.jsxs)("div",{className:"privacy-article-info-bar",children:[(0,b.jsxs)("div",{className:"privacy-info-item",children:[(0,b.jsx)("span",{children:"✍️"}),(0,b.jsx)("span",{children:"تنظیم‌کننده: واحد فناوری نوبیکس"})]}),(0,b.jsxs)("div",{className:"privacy-info-item",children:[(0,b.jsx)("span",{children:"📅"}),(0,b.jsx)("span",{children:"بروزرسانی: ۱۱ تیر ۱۴۰۵"})]}),(0,b.jsxs)("div",{className:"privacy-info-item",children:[(0,b.jsx)("span",{children:"⏱️"}),(0,b.jsx)("span",{children:"زمان مطالعه: ۳ دقیقه"})]})]}),(0,b.jsxs)("div",{className:"privacy-article-content",children:[(0,b.jsx)("p",{className:"privacy-intro",children:"حفاظت از اطلاعات شخصی و اکانت‌های بازی کاربران، بزرگترین دغدغه و تعهد اخلاقی و فنی نوبیکس شاپ است. ما با به‌کارگیری پروتکل‌های امنیتی روز دنیا، امنیت و محرمانگی داده‌های شما را تضمین می‌کنیم. در زیر جزئیات سیاست‌های حریم خصوصی نوبیکس را مطالعه فرمایید."}),(0,b.jsx)("div",{className:"privacy-list",children:e.privacyItems.map(a=>(0,b.jsxs)("div",{className:"privacy-card",children:[(0,b.jsx)("div",{className:"privacy-card-icon",children:a.icon}),(0,b.jsxs)("div",{className:"privacy-card-text",children:[(0,b.jsx)("h3",{children:a.title}),(0,b.jsx)("p",{children:a.description})]})]},a.title))}),(0,b.jsx)("div",{className:"privacy-footer-note",children:"نوبیکس شاپ به عنوان یک مرجع قانونی و دارای نماد اعتماد الکترونیکی فعال، همواره خود را ملزم به رعایت چارچوب‌های قانون تجارت الکترونیک جمهوری اسلامی ایران دانسته و بالاترین سطوح امنیتی را برای اطلاعات کاربران فراهم می‌آورد."})]})]}),(0,b.jsx)(d.default,{})]})})},"metadata",0,{title:"حریم خصوصی",alternates:{canonical:"/faq/privacy"},description:"سیاست‌های حفظ حریم خصوصی، حفاظت از داده‌های کاربران و پردازش امن سفارشات در نوبیکس شاپ."}])},56918,a=>{a.n(a.i(90801))}];

//# sourceMappingURL=%5Broot-of-the-server%5D__1smbgsi._.js.map