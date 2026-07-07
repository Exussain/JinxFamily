module.exports=[93695,(a,b,c)=>{b.exports=a.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},71306,(a,b,c)=>{b.exports=a.r(18622)},79847,a=>{a.n(a.i(3343))},9185,a=>{a.n(a.i(29432))},72842,a=>{a.n(a.i(75164))},54897,a=>{a.n(a.i(30106))},56157,a=>{a.n(a.i(18970))},94331,a=>{a.n(a.i(60644))},15988,a=>{a.n(a.i(56952))},25766,a=>{a.n(a.i(77341))},29725,a=>{a.n(a.i(94290))},90833,a=>{a.n(a.i(46994))},5785,a=>{a.n(a.i(90588))},74793,a=>{a.n(a.i(33169))},85826,a=>{a.n(a.i(37111))},21565,a=>{a.n(a.i(41763))},65911,a=>{a.n(a.i(8950))},25128,a=>{a.n(a.i(91562))},40781,a=>{a.n(a.i(49670))},69411,a=>{a.n(a.i(75700))},63081,a=>{a.n(a.i(276))},62837,a=>{a.n(a.i(40795))},34607,a=>{a.n(a.i(11614))},96338,a=>{a.n(a.i(21751))},50642,a=>{a.n(a.i(12213))},32242,a=>{a.n(a.i(22693))},88530,a=>{a.n(a.i(10531))},8583,a=>{a.n(a.i(1082))},75734,a=>{a.n(a.i(98175))},70408,a=>{a.n(a.i(9095))},22922,a=>{a.n(a.i(96772))},78294,a=>{a.n(a.i(71717))},16625,a=>{a.n(a.i(85034))},88648,a=>{a.n(a.i(68113))},51914,a=>{a.n(a.i(66482))},25466,a=>{a.n(a.i(91505))},71029,(a,b,c)=>{"use strict";c._=function(a){return a&&a.__esModule?a:{default:a}}},47452,a=>{"use strict";a.s(["default",()=>b]);let b=(0,a.i(11857).registerClientReference)(function(){throw Error("Attempted to call the default export of [project]/app/faq/HelpfulnessWidget.jsx <module evaluation> from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"[project]/app/faq/HelpfulnessWidget.jsx <module evaluation>","default")},30722,a=>{"use strict";a.s(["default",()=>b]);let b=(0,a.i(11857).registerClientReference)(function(){throw Error("Attempted to call the default export of [project]/app/faq/HelpfulnessWidget.jsx from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"[project]/app/faq/HelpfulnessWidget.jsx","default")},7637,a=>{"use strict";a.i(47452);var b=a.i(30722);a.n(b)},64122,a=>{"use strict";var b=a.i(7997),c=a.i(58452),d=a.i(7637),e=a.i(87559);a.s(["default",0,function(){return(0,b.jsx)(c.default,{title:"قوانین و مقررات",subtitle:"دستورالعمل‌ها و پیش‌نیازهای ضروری برای ثبت سریع و بدون خطای سفارش در نوبیکس.",activeSection:"rules",children:(0,b.jsxs)("div",{className:"rules-article-container",children:[(0,b.jsx)("style",{children:`
          .rules-article-container {
            display: flex;
            flex-direction: column;
            gap: 24px;
            width: 100%;
          }
          
          .rules-article-box {
            background: var(--card);
            border: 1px solid var(--line);
            border-radius: 24px;
            overflow: hidden;
            box-shadow: var(--shadow);
          }
          
          .rules-article-banner {
            height: 180px;
            background: linear-gradient(135deg, #4f46e5, #06b6d4);
            position: relative;
            padding: 40px;
            display: flex;
            align-items: flex-end;
            overflow: hidden;
          }
          
          .rules-article-banner::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 60%);
            pointer-events: none;
          }
          
          .rules-article-banner-icon {
            position: absolute;
            top: 20px;
            left: 20px;
            font-size: 80px;
            opacity: 0.15;
            user-select: none;
            color: #fff;
          }
          
          .rules-article-meta {
            display: flex;
            flex-direction: column;
            gap: 8px;
            z-index: 1;
          }
          
          .rules-article-tag {
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
          
          .rules-article-banner .page-banner-title {
            margin: 0;
            font-size: 28px;
            font-weight: 900;
            color: #fff;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .rules-article-info-bar {
            display: flex;
            gap: 20px;
            padding: 16px 40px;
            background: rgba(255, 255, 255, 0.02);
            border-bottom: 1px solid var(--line);
            font-size: 13px;
            color: var(--muted);
          }
          
          .rules-info-item {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          
          .rules-article-content {
            padding: 40px;
            color: var(--text);
            font-size: 16px;
            line-height: 1.9;
          }
          
          .rules-intro {
            font-size: 16px;
            color: var(--text);
            opacity: 0.95;
            margin-bottom: 32px;
          }
          
          .rules-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 24px;
            margin-bottom: 32px;
          }
          
          .rules-card {
            background: var(--bg);
            border: 1px solid var(--line);
            border-radius: 18px;
            padding: 24px;
            display: flex;
            gap: 20px;
            align-items: flex-start;
            transition: transform 0.2s, border-color 0.2s;
          }
          
          .rules-card:hover {
            transform: translateY(-2px);
            border-color: var(--primary);
          }
          
          .rules-card-icon {
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
          
          .rules-card-details h3 {
            margin: 0 0 8px 0;
            font-size: 17px;
            font-weight: 800;
            color: var(--text);
          }
          
          .rules-card-details p {
            margin: 0;
            font-size: 14px;
            color: var(--muted);
            line-height: 1.7;
          }
          
          .rules-footer-note {
            background: rgba(239, 68, 68, 0.05);
            border-right: 4px solid #ef4444;
            padding: 20px;
            border-radius: 12px;
            color: var(--text);
            font-size: 15px;
            line-height: 1.8;
          }
          
          @media (max-width: 768px) {
            .rules-article-banner {
              height: 140px;
              padding: 24px;
            }
            .rules-article-banner .page-banner-title {
              font-size: 22px;
            }
            .rules-article-info-bar {
              padding: 12px 24px;
              flex-wrap: wrap;
              gap: 12px;
            }
            .rules-article-content {
              padding: 24px;
            }
            .rules-card {
              flex-direction: column;
              gap: 12px;
              padding: 16px;
            }
          }
        `}),(0,b.jsxs)("div",{className:"rules-article-box",children:[(0,b.jsxs)("div",{className:"rules-article-banner",children:[(0,b.jsx)("span",{className:"rules-article-banner-icon",children:"⚖️"}),(0,b.jsxs)("div",{className:"rules-article-meta",children:[(0,b.jsx)("span",{className:"rules-article-tag",children:"اسناد رسمی"}),(0,b.jsx)("h2",{className:"page-banner-title",children:"قوانین و مقررات استفاده از نوبیکس شاپ"})]})]}),(0,b.jsxs)("div",{className:"rules-article-info-bar",children:[(0,b.jsxs)("div",{className:"rules-info-item",children:[(0,b.jsx)("span",{children:"✍️"}),(0,b.jsx)("span",{children:"تنظیم‌کننده: امور حقوقی نوبیکس"})]}),(0,b.jsxs)("div",{className:"rules-info-item",children:[(0,b.jsx)("span",{children:"📅"}),(0,b.jsx)("span",{children:"بروزرسانی: ۱۱ تیر ۱۴۰۵"})]}),(0,b.jsxs)("div",{className:"rules-info-item",children:[(0,b.jsx)("span",{children:"⏱️"}),(0,b.jsx)("span",{children:"زمان مطالعه: ۴ دقیقه"})]})]}),(0,b.jsxs)("div",{className:"rules-article-content",children:[(0,b.jsx)("p",{className:"rules-intro",children:"به منظور حفظ حقوق متقابل خریداران و فروشگاه نوبیکس شاپ و تضمین سرعت و امنیت در تمامی فعال‌سازی‌ها، قوانین زیر تدوین شده است. ثبت هرگونه سفارش در سایت به منزله مطالعه و پذیرش کامل این قوانین خواهد بود."}),(0,b.jsx)("div",{className:"rules-grid",children:e.rules.map((a,c)=>(0,b.jsxs)("div",{className:"rules-card",children:[(0,b.jsx)("div",{className:"rules-card-icon",children:a.icon}),(0,b.jsxs)("div",{className:"rules-card-details",children:[(0,b.jsxs)("h3",{children:[c+1,". ",a.title]}),(0,b.jsx)("p",{children:a.description})]})]},a.title))}),(0,b.jsxs)("div",{className:"rules-footer-note",children:[(0,b.jsx)("strong",{children:"توجه ویژه:"})," عدم رعایت هر یک از بندهای فوق، به ویژه عدم خاموش کردن تایید دو مرحله‌ای یا ورود همزمان به اکانت در حین پردازش سفارش، تعهد تحویل فوری نوبیکس شاپ را از بین برده و مسئولیت تاخیرهای ناشی از آن تماماً بر عهده خریدار خواهد بود."]})]})]}),(0,b.jsx)(d.default,{})]})})},"metadata",0,{title:"قوانین و مقررات",alternates:{canonical:"/faq/rules"},description:"دستورالعمل‌های اصلی و قوانین رسمی ثبت سفارش و استفاده از خدمات فروشگاه نوبیکس شاپ."}])},78787,a=>{a.n(a.i(64122))}];

//# sourceMappingURL=%5Broot-of-the-server%5D__0ydlkr-._.js.map