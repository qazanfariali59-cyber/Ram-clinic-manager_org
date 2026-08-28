import {
  chatGPTSignInPath,
  chatGPTSignOutPath,
  getChatGPTUser,
} from "./chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const identity = await getChatGPTUser();
  const actionHref = identity ? "/app" : chatGPTSignInPath("/app");

  return (
    <main className="login-page" dir="rtl">
      <section className="login-card">
        <div className="login-brand">
          <img src="/ram-brand.jpg" alt="نشان رام" />
          <div>
            <strong>RAM Clinic OS</strong>
            <span>سامانه مدیریت کلینیک درد رام</span>
          </div>
        </div>
        <div className="login-copy">
          <span>صفحه ورود امن و نقش‌محور</span>
          <h1>همهٔ مسیر درمان، در یک پرونده منظم</h1>
          <p>
            برای ورود کارکنان، پزشکان، همکاران و بیماران از حساب ChatGPT
            تأییدشده استفاده می‌شود.
          </p>
        </div>
        <div className="login-features">
          <div>
            <strong>پرونده تایملاین</strong>
            <small>نوبت، درمان و پرداخت</small>
          </div>
          <div>
            <strong>دسترسی محدود</strong>
            <small>هر نقش فقط اطلاعات لازم</small>
          </div>
          <div>
            <strong>ثبت رویدادها</strong>
            <small>فعالیت‌های مهم قابل پیگیری</small>
          </div>
        </div>
        <a className="login-button" href={actionHref} target="_top">
          {identity ? "ادامه به سامانه" : "ورود به سامانه"}
        </a>
        {identity ? (
          <small className="login-note">
            با حساب {identity.email} وارد هستید. {" "}
            <a href={chatGPTSignOutPath("/")} target="_top">
              تغییر حساب
            </a>
          </small>
        ) : (
          <small className="login-note">
            با ورود، هویت حساب برای کنترل دسترسی سامانه استفاده می‌شود.
          </small>
        )}
      </section>
      <aside className="login-visual" aria-hidden="true">
        <img src="/ram-brand.jpg" alt="" />
        <div>
          <span>پرونده بیمار</span>
          <strong>دید کامل برای تیم درمان؛ دید محدود برای دیگر نقش‌ها</strong>
        </div>
      </aside>
    </main>
  );
}
