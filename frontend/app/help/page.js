export const metadata = { title: 'راهنما و سوالات متداول' };

export default function HelpPage() {
  return (
    <main className="container" style={{display:'grid', gap:16}}>
      <div className="navbar"><div className="container nav-inner"><a className="brand" href="/">نوبیکس</a></div></div>
      <div className="card section">
        <h2>سوالات متداول</h2>
        <p className="muted">پاسخ کوتاه به پرسش‌های پرتکرار کاربران.</p>
        <div style={{display:'grid', gap:12, marginTop:12}}>
          <div>
            <b>چقدر طول می‌کشد تا آیتم فعال شود؟</b>
            <div className="muted">بازه معمول ۱ تا ۱۰ دقیقه است. سفارش‌های شلوغی ممکن است کمی بیشتر زمان ببرند.</div>
          </div>
          <div>
            <b>نیاز به رمز عبور اکانت دارم؟</b>
            <div className="muted">خیر. فقط نام کاربری اپیک و ارتباط تماس برای هماهنگی کافی است.</div>
          </div>
          <div>
            <b>روش‌های پرداخت چیست؟</b>
            <div className="muted">درگاه شتاب/کارت به کارت. پس از پرداخت، سفارش شما بصورت خودکار ثبت و پردازش می‌شود.</div>
          </div>
        </div>
      </div>
    </main>
  );
}

