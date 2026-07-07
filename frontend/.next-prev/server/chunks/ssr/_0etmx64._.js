module.exports=[16426,(a,b,c)=>{"use strict";Object.defineProperty(c,"__esModule",{value:!0}),Object.defineProperty(c,"warnOnce",{enumerable:!0,get:function(){return d}});let d=a=>{}},29945,(a,b,c)=>{"use strict";let d;Object.defineProperty(c,"__esModule",{value:!0});var e={getAssetToken:function(){return i},getAssetTokenQuery:function(){return j},getDeploymentId:function(){return g},getDeploymentIdQuery:function(){return h}};for(var f in e)Object.defineProperty(c,f,{enumerable:!0,get:e[f]});function g(){return d}function h(a=!1){return d?`${a?"&":"?"}dpl=${d}`:""}function i(){return!1}function j(a=!1){return""}d=void 0},1359,(a,b,c)=>{"use strict";function d({widthInt:a,heightInt:b,blurWidth:c,blurHeight:e,blurDataURL:f,objectFit:g}){let h=c?40*c:a,i=e?40*e:b,j=h&&i?`viewBox='0 0 ${h} ${i}'`:"";return`%3Csvg xmlns='http://www.w3.org/2000/svg' ${j}%3E%3Cfilter id='b' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3CfeColorMatrix values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 100 -1' result='s'/%3E%3CfeFlood x='0' y='0' width='100%25' height='100%25'/%3E%3CfeComposite operator='out' in='s'/%3E%3CfeComposite in2='SourceGraphic'/%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3C/filter%3E%3Cimage width='100%25' height='100%25' x='0' y='0' preserveAspectRatio='${j?"none":"contain"===g?"xMidYMid":"cover"===g?"xMidYMid slice":"none"}' style='filter: url(%23b);' href='${f}'/%3E%3C/svg%3E`}Object.defineProperty(c,"__esModule",{value:!0}),Object.defineProperty(c,"getImageBlurSvg",{enumerable:!0,get:function(){return d}})},53549,(a,b,c)=>{"use strict";Object.defineProperty(c,"__esModule",{value:!0});var d={VALID_LOADERS:function(){return f},imageConfigDefault:function(){return g}};for(var e in d)Object.defineProperty(c,e,{enumerable:!0,get:d[e]});let f=["default","imgix","cloudinary","akamai","custom"],g={deviceSizes:[640,750,828,1080,1200,1920,2048,3840],imageSizes:[32,48,64,96,128,256,384],path:"/_next/image",loader:"default",loaderFile:"",domains:[],disableStaticImages:!1,minimumCacheTTL:14400,formats:["image/webp"],maximumDiskCacheSize:void 0,maximumRedirects:3,maximumResponseBody:5e7,dangerouslyAllowLocalIP:!1,dangerouslyAllowSVG:!1,contentSecurityPolicy:"script-src 'none'; frame-src 'none'; sandbox;",contentDispositionType:"attachment",localPatterns:void 0,remotePatterns:[],qualities:[75],unoptimized:!1,customCacheHandler:!1}},87713,(a,b,c)=>{"use strict";Object.defineProperty(c,"__esModule",{value:!0}),Object.defineProperty(c,"getImgProps",{enumerable:!0,get:function(){return j}}),a.r(16426);let d=a.r(29945),e=a.r(1359),f=a.r(53549),g=["-moz-initial","fill","none","scale-down",void 0];function h(a){return void 0!==a.default}function i(a){return void 0===a?a:"number"==typeof a?Number.isFinite(a)?a:NaN:"string"==typeof a&&/^[0-9]+$/.test(a)?parseInt(a,10):NaN}function j({src:a,sizes:b,unoptimized:c=!1,priority:k=!1,preload:l=!1,loading:m,className:n,quality:o,width:p,height:q,fill:r=!1,style:s,overrideSrc:t,onLoad:u,onLoadingComplete:v,placeholder:w="empty",blurDataURL:x,fetchPriority:y,decoding:z="async",layout:A,objectFit:B,objectPosition:C,lazyBoundary:D,lazyRoot:E,...F},G){var H;let I,J,K,{imgConf:L,showAltText:M,blurComplete:N,defaultLoader:O}=G,P=L||f.imageConfigDefault;if("allSizes"in P)I=P;else{let a=[...P.deviceSizes,...P.imageSizes].sort((a,b)=>a-b),b=P.deviceSizes.sort((a,b)=>a-b),c=P.qualities?.sort((a,b)=>a-b);I={...P,allSizes:a,deviceSizes:b,qualities:c}}if(void 0===O)throw Object.defineProperty(Error("images.loaderFile detected but the file is missing default export.\nRead more: https://nextjs.org/docs/messages/invalid-images-config"),"__NEXT_ERROR_CODE",{value:"E163",enumerable:!1,configurable:!0});let Q=F.loader||O;delete F.loader,delete F.srcSet;let R="__next_img_default"in Q;if(R){if("custom"===I.loader)throw Object.defineProperty(Error(`Image with src "${a}" is missing "loader" prop.
Read more: https://nextjs.org/docs/messages/next-image-missing-loader`),"__NEXT_ERROR_CODE",{value:"E252",enumerable:!1,configurable:!0})}else{let a=Q;Q=b=>{let{config:c,...d}=b;return a(d)}}if(A){"fill"===A&&(r=!0);let a={intrinsic:{maxWidth:"100%",height:"auto"},responsive:{width:"100%",height:"auto"}}[A];a&&(s={...s,...a});let c={responsive:"100vw",fill:"100vw"}[A];c&&!b&&(b=c)}let S="",T=i(p),U=i(q);if((H=a)&&"object"==typeof H&&(h(H)||void 0!==H.src)){let b=h(a)?a.default:a;if(!b.src)throw Object.defineProperty(Error(`An object should only be passed to the image component src parameter if it comes from a static image import. It must include src. Received ${JSON.stringify(b)}`),"__NEXT_ERROR_CODE",{value:"E460",enumerable:!1,configurable:!0});if(!b.height||!b.width)throw Object.defineProperty(Error(`An object should only be passed to the image component src parameter if it comes from a static image import. It must include height and width. Received ${JSON.stringify(b)}`),"__NEXT_ERROR_CODE",{value:"E48",enumerable:!1,configurable:!0});if(J=b.blurWidth,K=b.blurHeight,x=x||b.blurDataURL,S=b.src,!r)if(T||U){if(T&&!U){let a=T/b.width;U=Math.round(b.height*a)}else if(!T&&U){let a=U/b.height;T=Math.round(b.width*a)}}else T=b.width,U=b.height}let V=!k&&!l&&("lazy"===m||void 0===m);(!(a="string"==typeof a?a:S)||a.startsWith("data:")||a.startsWith("blob:"))&&(c=!0,V=!1),I.unoptimized&&(c=!0),R&&!I.dangerouslyAllowSVG&&a.split("?",1)[0].endsWith(".svg")&&(c=!0);let W=i(o),X=Object.assign(r?{position:"absolute",height:"100%",width:"100%",left:0,top:0,right:0,bottom:0,objectFit:B,objectPosition:C}:{},M?{}:{color:"transparent"},s),Y=N||"empty"===w?null:"blur"===w?`url("data:image/svg+xml;charset=utf-8,${(0,e.getImageBlurSvg)({widthInt:T,heightInt:U,blurWidth:J,blurHeight:K,blurDataURL:x||"",objectFit:X.objectFit})}")`:`url("${w}")`,Z=g.includes(X.objectFit)?"fill"===X.objectFit?"100% 100%":"cover":X.objectFit,$=Y?{backgroundSize:Z,backgroundPosition:X.objectPosition||"50% 50%",backgroundRepeat:"no-repeat",backgroundImage:Y}:{},_=function({config:a,src:b,unoptimized:c,width:e,quality:f,sizes:g,loader:h}){if(c){if(b.startsWith("/")&&!b.startsWith("//")){let a=(0,d.getDeploymentId)();if(a){let c=b.indexOf("?");if(-1!==c){let d=new URLSearchParams(b.slice(c+1));d.get("dpl")||(d.append("dpl",a),b=b.slice(0,c)+"?"+d.toString())}else b+=`?dpl=${a}`}}return{src:b,srcSet:void 0,sizes:void 0}}let{widths:i,kind:j}=function({deviceSizes:a,allSizes:b},c,d){if(d){let c=/(^|\s)(1?\d?\d)vw/g,e=[];for(let a;a=c.exec(d);)e.push(parseInt(a[2]));if(e.length){let c=.01*Math.min(...e);return{widths:b.filter(b=>b>=a[0]*c),kind:"w"}}return{widths:b,kind:"w"}}return"number"!=typeof c?{widths:a,kind:"w"}:{widths:[...new Set([c,2*c].map(a=>b.find(b=>b>=a)||b[b.length-1]))],kind:"x"}}(a,e,g),k=i.length-1;return{sizes:g||"w"!==j?g:"100vw",srcSet:i.map((c,d)=>`${h({config:a,src:b,quality:f,width:c})} ${"w"===j?c:d+1}${j}`).join(", "),src:h({config:a,src:b,quality:f,width:i[k]})}}({config:I,src:a,unoptimized:c,width:T,quality:W,sizes:b,loader:Q}),aa=V?"lazy":m;return{props:{...F,loading:aa,fetchPriority:y,width:T,height:U,decoding:z,className:n,style:{...X,...$},sizes:_.sizes,srcSet:_.srcSet,src:t||_.src},meta:{unoptimized:c,preload:l||k,placeholder:w,fill:r}}}},42377,(a,b,c)=>{let{createClientModuleProxy:d}=a.r(11857);a.n(d("[project]/node_modules/next/dist/client/image-component.js <module evaluation>"))},43489,(a,b,c)=>{let{createClientModuleProxy:d}=a.r(11857);a.n(d("[project]/node_modules/next/dist/client/image-component.js"))},18409,a=>{"use strict";a.i(42377);var b=a.i(43489);a.n(b)},53200,(a,b,c)=>{"use strict";function d(a,b){let c=a||75;return b?.qualities?.length?b.qualities.reduce((a,b)=>Math.abs(b-c)<Math.abs(a-c)?b:a,b.qualities[0]):c}Object.defineProperty(c,"__esModule",{value:!0}),Object.defineProperty(c,"findClosestQuality",{enumerable:!0,get:function(){return d}})},37763,(a,b,c)=>{"use strict";Object.defineProperty(c,"__esModule",{value:!0}),Object.defineProperty(c,"default",{enumerable:!0,get:function(){return g}});let d=a.r(53200),e=a.r(29945);function f({config:a,src:b,width:c,quality:g}){let h=(0,e.getDeploymentId)();if(b.startsWith("/")&&!b.startsWith("//")){let a=b.indexOf("?");if(-1!==a){let c=new URLSearchParams(b.slice(a+1)),d=c.get("dpl");if(d){h=d,c.delete("dpl");let e=c.toString();b=b.slice(0,a)+(e?"?"+e:"")}}}if(b.startsWith("/")&&b.includes("?")&&a.localPatterns?.length===1&&"**"===a.localPatterns[0].pathname&&""===a.localPatterns[0].search)throw Object.defineProperty(Error(`Image with src "${b}" is using a query string which is not configured in images.localPatterns.
Read more: https://nextjs.org/docs/messages/next-image-unconfigured-localpatterns`),"__NEXT_ERROR_CODE",{value:"E871",enumerable:!1,configurable:!0});let i=(0,d.findClosestQuality)(g,a);return`${a.path}?url=${encodeURIComponent(b)}&w=${c}&q=${i}${b.startsWith("/")&&h?`&dpl=${h}`:""}`}f.__next_img_default=!0;let g=f},50858,(a,b,c)=>{"use strict";Object.defineProperty(c,"__esModule",{value:!0});var d={default:function(){return k},getImageProps:function(){return j}};for(var e in d)Object.defineProperty(c,e,{enumerable:!0,get:d[e]});let f=a.r(71029),g=a.r(87713),h=a.r(18409),i=f._(a.r(37763));function j(a){let{props:b}=(0,g.getImgProps)(a,{defaultLoader:i.default,imgConf:{deviceSizes:[640,750,828,1080,1200,1920,2048,3840],imageSizes:[32,48,64,96,128,256,384],qualities:[75],path:"/_next/image",loader:"default",dangerouslyAllowSVG:!1,unoptimized:!1}});for(let[a,c]of Object.entries(b))void 0===c&&delete b[a];return{props:b}}let k=h.Image},3236,(a,b,c)=>{b.exports=a.r(50858)},58452,a=>{"use strict";var b=a.i(7997),c=a.i(3236),d=a.i(95936),e=a.i(6557),f=a.i(717);let g=[{title:"راهنما و پشتیبانی",items:[{id:"faq",label:"سوالات متداول",href:"/faq"},{id:"about",label:"درباره نوبیکس",href:"/faq/about"},{id:"contact",label:"تماس با ما",href:"/faq/contact"},{id:"how-to-buy",label:"راهنمای خرید",href:"/faq/how-to-buy"}]},{title:"قوانین و حریم خصوصی",items:[{id:"rules",label:"قوانین و مقررات",href:"/faq/rules"},{id:"privacy",label:"حریم خصوصی",href:"/faq/privacy"}]},{title:"راهنمای اکانت",items:[{id:"disable-2fa",label:"خاموش کردن ۲FA",href:"/guides/disable-2fa"},{id:"link-unlink",label:"لینک و آنلینک اکانت",href:"/guides/link-unlink"},{id:"remove-restriction",label:"رفع محدودیت حساب",href:"/guides/remove-restriction"}]}],h=[{href:"https://trustseal.enamad.ir/?id=671892&Code=BvHIZx1aeWqVhIlNuGSIySWJ49Yd2uE2",src:"https://trustseal.enamad.ir/logo.aspx?id=671892&Code=BvHIZx1aeWqVhIlNuGSIySWJ49Yd2uE2",alt:"نماد اعتماد الکترونیکی نوبیکس",width:45,height:45},{href:"https://www.zarinpal.com/trustPage/nubixshop.ir",src:"/icons/ZarinPal.svg",alt:"درگاه پرداخت زرین‌پال",width:120,height:40}];a.s(["default",0,function({title:a,subtitle:i,activeSection:j,children:k}){return(0,b.jsxs)(b.Fragment,{children:[(0,b.jsx)(f.Suspense,{fallback:null,children:(0,b.jsx)(e.default,{})}),(0,b.jsxs)("div",{className:"faq-page-wrapper",children:[(0,b.jsx)("style",{children:`
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

//# sourceMappingURL=_0etmx64._.js.map