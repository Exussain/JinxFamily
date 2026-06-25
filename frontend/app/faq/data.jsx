const faqItems = [
  {
    question: 'چرا نوبیکس شاپ را انتخاب کنیم؟',
    answer:
      'تمامی سفارشات به‌صورت قانونی و با حساب‌های احراز هویت‌شده انجام می‌شود. پرداخت امن از طریق درگاه رسمی زرین‌پال، سابقه طولانی فعالیت و پشتیبانی اختصاصی دلیل اعتماد مشتریان به نوبیکس است.',
  },
  {
    question: 'سفارشات چگونه تکمیل می‌شوند؟',
    answer:
      'پس از ثبت سفارش، فعال‌سازی کاملاً خودکار آغاز می‌شود و نتیجه نهایی به‌وسیله پیامک، ایمیل و پنل کاربری اطلاع‌رسانی خواهد شد.',
  },
  {
    question: 'چگونه سفارش خود را پیگیری کنم؟',
    answer:
      'تنها در صورتی با پشتیبانی تماس بگیرید که از زمان سفارش شما حداقل ۲۴ ساعت گذشته باشد. با کد پیگیری از پشتیبانی تلگرام @Nubixsupport پیگیری کنید؛ از ارسال پیام‌های مکرر خودداری نمایید.',
  },
  {
    question: 'ساعات کاری پشتیبانی چیست؟',
    answer:
      'پشتیبانی تلفنی شنبه تا چهارشنبه ۱۱ تا ۱۶، یکشنبه ۱۳ تا ۱۶ و پشتیبانی تلگرام ۲۴ ساعته پاسخگوی شماست.',
  },
  {
    question: 'روش پرداخت چگونه است؟',
    answer:
      'پرداخت‌ها فقط از طریق درگاه امن زرین‌پال و شبکه شاپرک انجام می‌شود. به‌هیچ‌وجه فروش کارت‌به‌کارت نداریم و اطلاعات کارت در سرور ما ذخیره نمی‌شود.',
  },
  {
    question: 'آیا می‌توانم به نوبیکس اعتماد کنم؟',
    answer:
      'نماد اعتماد الکترونیکی فعال، درگاه زرین‌پال، دفاتر رسمی در تهران و ازمیر، حساب‌های بانکی قانونی و صدها نظر مثبت واقعی اعتبار نوبیکس را تضمین می‌کند.',
  },
  {
    question: 'چه محصولاتی در نوبیکس موجود است؟',
    answer:
      'پک‌های فورتنایت، گیفت کارت‌های متنوع، اشتراک‌های هوش مصنوعی و سرویس‌های گیمینگ به‌صورت لحظه‌ای در سایت به‌روزرسانی می‌شوند.',
  },
  {
    question: 'چرا برخی کارت‌های مجازی کار نمی‌کنند؟',
    answer:
      'به دلیل قوانین ضدپولشویی ترکیه، کارت‌های مجازی مثل Papara یا Ozan برای غیرمقیمین مسدود شده‌اند؛ نوبیکس با حساب‌های قانونی ترکیه هیچ مشکلی در فعال‌سازی ندارد.',
  },
];

const rules = [
  {
    title: 'صحت اطلاعات اکانت',
    description: 'قبل از ارسال سفارش از درستی ایمیل، پلتفرم و مشخصات اکانت اطمینان حاصل فرمایید. هرگونه خطا مسئولیت کاربر است.',
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  },
  {
    title: 'غیرفعال‌سازی دو مرحله‌ای',
    description: 'در زمان ارسال اطلاعات احراز هویت دو مرحله‌ای را خاموش کنید تا سفارش بدون تأخیر انجام شود.',
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  },
  {
    title: 'عدم ورود تا تکمیل',
    description: 'تا دریافت پیام تکمیل سفارش وارد اکانت خود نشوید تا فرایند فعال‌سازی بدون خطا انجام شود.',
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
  },
  {
    title: 'پرهیز از پیام‌های تکراری',
    description: 'ارسال پیام مکرر به پشتیبانی باعث تأخیر و انتقال شما به انتهای صف می‌شود؛ فقط در صورت لزوم پیام دهید.',
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  },
  {
    title: 'پیگیری بعد از ۲۴ ساعت',
    description: 'تنها در صورتی با پشتیبانی تماس بگیرید که از زمان سفارش شما حداقل ۲۴ ساعت گذشته باشد. با کد پیگیری و فقط یک‌بار درخواست پشتیبانی کنید.',
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  },
  {
    title: 'کانال رسمی پشتیبانی',
    description: 'پشتیبانی فقط از طریق تلگرام @Nubixsupport انجام می‌شود. از آیدی‌های غیررسمی استفاده نکنید.',
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 17H2a3 3 0 0 0 3-3V9a7.65 7.65 0 0 1 15 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/></svg>,
  },
];

const privacyItems = [
  {
    title: 'جمع‌آوری اطلاعات',
    description:
      'خلاصه‌ای از اطلاعات شماره تلفن، ایمیل و مشخصات اکانت برای تکمیل سفارش ذخیره می‌شود و به‌جز این موارد هیچ داده اضافی جمع‌آوری نمی‌شود.',
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  },
  {
    title: 'امنیت داده‌ها',
    description:
      'اطلاعات کاربران در سرورهای امن نگهداری و فقط به‌وسیله کارکنان مجاز قابل مشاهده است. تمامی ارتباطات رمزنگاری‌شده هستند.',
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  },
  {
    title: 'عدم اشتراک‌گذاری',
    description:
      'اطلاعات کاربر تحت هیچ شرایطی به اشخاص ثالث فروخته یا واگذار نمی‌شود و فقط برای پردازش سفارش به‌کار می‌رود.',
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
  },
  {
    title: 'پرداخت امن',
    description:
      'پرداخت‌ها از طریق زرین‌پال و شبکه شاپرک انجام می‌شود و اطلاعات بانکی هرگز در سیستم ما ثبت نخواهد شد.',
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  },
  {
    title: 'رعایت قوانین',
    description:
      'نوبیکس با داشتن نماد اعتماد الکترونیکی متعهد به رعایت تمام مقررات تجارت الکترونیک ایران است.',
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  },
  {
    title: 'حق حذف اطلاعات',
    description:
      'کاربر می‌تواند درخواست حذف اطلاعات را از طریق پشتیبانی ارسال کند. اعمال حذف در اسرع وقت انجام می‌شود.',
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  },
];

const contactChannels = [
  {
    title: 'پشتیبانی تلفنی',
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
    value: '+98 21 9169 4759',
    detail: 'پاسخگویی شنبه تا چهارشنبه ۱۱ تا ۱۶ و یکشنبه ۱۳ تا ۱۶',
    tag: 'تماس فوری',
  },
  {
    title: 'پشتیبانی تلگرام',
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>,
    value: '@Nubixsupport',
    detail: 'پیگیری سفارش، ارسال اسکرین پرداخت و سوالات متداول',
    tag: 'تلگرام رسمی',
  },
  {
    title: 'ایمیل',
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    value: 'support@nubixshop.ir',
    detail: 'ارسال اسکرین پرداخت یا اطلاعات تکمیلی: Contact.NubixShop@gmail.com',
    tag: 'پاسخ‌گویی ۲۴ ساعته',
  },
];

const officeLocations = [
  {
    title: 'دفتر تهران',
    description: 'منطقه ۸، تهران - دفتر رسمی نوبیکس در ایران',
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  },
  {
    title: 'دفتر ازمیر',
    description: 'ازمیر، ترکیه - شعبه بین‌المللی و خط تماس مستقیم',
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  },
];

const purchaseSteps = [
  {
    step: 1,
    title: 'انتخاب محصول',
    description: 'پک فورتنایت، گیفت کارت یا سرویس هوش مصنوعی مورد نظر را انتخاب کنید.',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  },
  {
    step: 2,
    title: 'ثبت اطلاعات',
    description: 'تمامی اطلاعات اکانت و پلتفرم را با دقت وارد کنید.',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  },
  {
    step: 3,
    title: 'پرداخت امن',
    description: 'پرداخت را از طریق درگاه زرین‌پال انجام داده و رسید را نگه دارید.',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  },
  {
    step: 4,
    title: 'ارسال اطلاعات',
    description: 'اسکرین شات پرداخت، اطلاعات اکانت و شماره تلفن را به پشتیبانی ارسال کنید.',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  },
  {
    step: 5,
    title: 'انتظار تکمیل',
    description: 'تا زمان دریافت پیام تکمیل سفارش وارد اکانت نشوید.',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  },
  {
    step: 6,
    title: 'تأیید و استفاده',
    description: 'پس از پیام تایید، وارد اکانت شوید و از محصول جدید بهره‌مند شوید.',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  },
];

export {
  faqItems,
  rules,
  privacyItems,
  contactChannels,
  officeLocations,
  purchaseSteps,
};
