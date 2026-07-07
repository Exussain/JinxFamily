import Link from "next/link";
import FaqSectionLayout from "../../../components/FaqSectionLayout";
import HelpfulnessWidget from "../HelpfulnessWidget";

export const metadata = {
  title: "درباره نوبیکس شاپ | داستان ما",
  alternates: { canonical: "/faq/about" },
  description:
    "داستان نوبیکس شاپ؛ از یک ایده کوچک در سال ۱۳۹۷ تا تبدیل شدن به یکی از مطمئن‌ترین فروشگاه‌های محصولات گیمینگ و اشتراک‌های بین‌المللی در ایران.",
};

const milestones = [
  {
    year: "۱۳۹۷",
    title: "جرقه یک ایده",
    text: "همه‌چیز با علاقه‌ی چند گیمر به دنیای بازی آغاز شد؛ جایی که تصمیم گرفتیم راهی امن و قانونی برای خرید محصولات گیمینگ در ایران بسازیم.",
  },
  {
    year: "۱۳۹۸",
    title: "اولین سفارش‌ها",
    text: "با تمرکز بر صداقت و پاسخگویی، اعتماد نخستین مشتریان را جلب کردیم و پایه‌های یک برند ماندگار را بنا نهادیم.",
  },
  {
    year: "۱۴۰۰",
    title: "زیرساخت قانونی",
    text: "با دریافت نماد اعتماد الکترونیکی و راه‌اندازی درگاه رسمی زرین‌پال، خرید در نوبیکس کاملاً شفاف و تضمین‌شده شد.",
  },
  {
    year: "۱۴۰۲",
    title: "گسترش بین‌المللی",
    text: "با تأسیس شعبه‌ی ازمیر ترکیه و استفاده از حساب‌های کاملاً قانونی، فعال‌سازی سفارش‌ها بدون خطا و ریجکت انجام شد.",
  },
  {
    year: "امروز",
    title: "نسل تازه نوبیکس",
    text: "پشتیبانی هوشمند، پنل همکاری فروش (B2B) و صدها سفارش موفق روزانه؛ نوبیکس امروز فراتر از یک فروشگاه، یک تجربه‌ی مطمئن است.",
  },
];

const values = [
  {
    icon: "🛡️",
    title: "خرید کاملاً قانونی",
    text: "تمام فعال‌سازی‌ها با حساب‌های احراز هویت‌شده و رسمی انجام می‌شود تا امنیت اکانت شما تضمین شود.",
  },
  {
    icon: "⚡",
    title: "سرعت و دقت",
    text: "سفارش‌ها در کوتاه‌ترین زمان ممکن پردازش و نتیجه با پیامک و ایمیل به شما اطلاع داده می‌شود.",
  },
  {
    icon: "🤝",
    title: "پشتیبانی انسانی",
    text: "از لحظه ثبت سفارش تا تحویل نهایی، تیم پشتیبانی نوبیکس واقعاً کنار شماست؛ نه یک ربات سرد.",
  },
  {
    icon: "💎",
    title: "قیمت منصفانه",
    text: "با حذف واسطه‌ها و خرید مستقیم، محصولات را با کمترین کارمزد ممکن به دست شما می‌رسانیم.",
  },
];

const stats = [
  { value: "+۶", label: "سال تجربه" },
  { value: "+۱۰٬۰۰۰", label: "سفارش موفق" },
  { value: "۲", label: "دفتر رسمی (تهران و ازمیر)" },
  { value: "۲۴/۷", label: "پشتیبانی تلگرام" },
];

export default function FaqAboutPage() {
  return (
    <FaqSectionLayout
      title="درباره نوبیکس"
      subtitle="داستان ما، ارزش‌هایی که به آن پایبندیم و مسیری که ما را به نوبیکس امروز رساند."
      activeSection="about"
    >
      <div className="about-container">
        <style>{`
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
        `}</style>

        <div className="about-box">
          <div className="about-banner">
            <span className="about-banner-icon">🚀</span>
            <span className="about-banner-tag">داستان ما</span>
            <h2>ما نوبیکس هستیم؛ ساخته‌شده با علاقه به گیم</h2>
            <p>
              راهی امن، قانونی و انسانی برای خرید محصولات گیمینگ و اشتراک‌های بین‌المللی؛
              همان چیزی که سال‌ها پیش آرزویش را داشتیم و امروز آن را برای شما ساخته‌ایم.
            </p>
          </div>

          <div className="about-content">
            <div className="about-story">
              <p>
                داستان نوبیکس از یک دغدغه‌ی ساده شروع شد. حدود{" "}
                <Link
                  href="https://www.zarinpal.com/trustPage/nubixshop.ir"
                  target="_blank"
                  rel="noreferrer"
                  className="story-link"
                >
                  سال ۱۳۹۷
                </Link>{" "}
                بود که تیم ما فکر راه‌اندازی یک فروشگاه آنلاین را در سر داشت؛ جمعی از
                گیمرها که هر روز با یک مشکل مشترک روبه‌رو بودند: خرید محصولات درون‌بازی و
                اشتراک‌های خارجی در ایران نه ساده بود، نه امن. تحریم‌ها، نبود کارت‌های
                اعتباری بین‌المللی و فروشگاه‌های واسطِ بی‌اعتبار، تجربه‌ی خرید را برای هر
                گیمر ایرانی به کابوسی همراه با نگرانی تبدیل کرده بود.
              </p>
              <p>
                ما تصمیم گرفتیم این تجربه را از پایه تغییر دهیم. به‌جای وعده‌های بزرگ، روی
                چیزهایی سرمایه‌گذاری کردیم که واقعاً اهمیت دارند: <strong>صداقت</strong>،
                <strong> خرید کاملاً قانونی</strong> و <strong>پشتیبانی واقعی و انسانی</strong>.
                اولین سفارش‌ها با وسواس تمام انجام شد و همان روزها فهمیدیم که اعتماد، تنها
                سرمایه‌ای است که ارزش ساختن دارد.
              </p>
              <p>
                در ادامه‌ی مسیر، زیرساخت را قانونی و شفاف کردیم؛ نماد اعتماد الکترونیکی را
                دریافت کردیم، پرداخت‌ها را به درگاه رسمی و امن زرین‌پال سپردیم و برای انجام
                بدون خطای سفارش‌ها، شعبه‌ای رسمی در ازمیر ترکیه راه‌اندازی کردیم. امروز
                نوبیکس با پشتیبانی هوشمند، پنل همکاری فروش و هزاران سفارش موفق، همان رؤیای
                سال ۱۳۹۷ است که بزرگ شده — اما هنوز به همان اصل اول وفادار مانده: کنار شما
                بودن تا آخرین لحظه.
              </p>
            </div>

            <div className="about-stats">
              {stats.map((s) => (
                <div key={s.label} className="about-stat">
                  <span className="about-stat-value">{s.value}</span>
                  <span className="about-stat-label">{s.label}</span>
                </div>
              ))}
            </div>

            <h3 className="about-section-title">مسیری که آمده‌ایم</h3>
            <div className="about-timeline">
              {milestones.map((m) => (
                <div key={m.year} className="about-tl-item">
                  <span className="about-tl-year">{m.year}</span>
                  <h4>{m.title}</h4>
                  <p>{m.text}</p>
                </div>
              ))}
            </div>

            <h3 className="about-section-title">ارزش‌های ما</h3>
            <div className="about-values-grid">
              {values.map((v) => (
                <div key={v.title} className="about-value-card">
                  <span className="about-value-icon">{v.icon}</span>
                  <h4>{v.title}</h4>
                  <p>{v.text}</p>
                </div>
              ))}
            </div>

            <div className="about-cta">
              <h3>آماده‌اید تجربه‌ی خرید مطمئن را شروع کنید؟</h3>
              <p>هزاران گیمر ایرانی به نوبیکس اعتماد کرده‌اند؛ حالا نوبت شماست.</p>
              <div className="about-cta-btns">
                <Link href="/" className="about-cta-btn primary">
                  مشاهده محصولات
                </Link>
                <Link href="/faq/contact" className="about-cta-btn ghost">
                  تماس با ما
                </Link>
              </div>
            </div>
          </div>
        </div>

        <HelpfulnessWidget />
      </div>
    </FaqSectionLayout>
  );
}
