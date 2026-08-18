"use client";

import { FormEvent, useState } from "react";

type ChatMessage = { role: "user" | "assistant"; text: string };

const quickPrompts = [
  "وضعیت امروز کلینیک را خلاصه کن و سه اقدام اولویت‌دار بده.",
  "برای افزایش ارجاع همکاران پزشک چه برنامه‌ای پیشنهاد می‌کنی؟",
  "شاخص‌های مهمی که مدیر کلینیک درد باید هر روز ببیند چیست؟",
  "برای بهبود جریان پذیرش و کاهش زمان انتظار پیشنهاد بده.",
];

export default function AiClient({ displayName, role }: { displayName: string; role: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: `سلام ${displayName.split(" ")[0] || ""}، من دستیار هوش مصنوعی مدیریتی رام هستم. می‌توانم بر اساس شاخص‌های تجمیعی سامانه در تحلیل عملیات، برنامه‌ریزی، گزارش‌نویسی و تصمیم‌سازی کمکت کنم.`,
    },
  ]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function ask(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    setError("");
    setMessages((old) => [...old, { role: "user", text: message }]);
    setDraft("");
    setBusy(true);
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const payload = await response.json() as { text?: string; error?: string };
      if (!response.ok || !payload.text) throw new Error(payload.error || "پاسخی دریافت نشد");
      setMessages((old) => [...old, { role: "assistant", text: payload.text as string }]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "ارتباط با دستیار ناموفق بود");
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(draft);
  }

  return (
    <main className="ram-ai-shell" dir="rtl">
      <style>{`
        *{box-sizing:border-box}.ram-ai-shell{min-height:100vh;background:radial-gradient(circle at 72% 12%,rgba(29,214,255,.13),transparent 26%),radial-gradient(circle at 18% 82%,rgba(99,82,255,.12),transparent 28%),#071018;color:#eafaff;font-family:Tahoma,Arial,sans-serif;padding:28px}.ram-ai-frame{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:300px minmax(0,1fr);gap:20px;min-height:calc(100vh - 56px)}.ram-ai-side,.ram-ai-chat{border:1px solid rgba(140,232,255,.14);background:rgba(7,19,29,.72);backdrop-filter:blur(20px);box-shadow:0 24px 80px rgba(0,0,0,.35);border-radius:26px}.ram-ai-side{padding:22px;display:flex;flex-direction:column}.ram-ai-brand{display:flex;align-items:center;gap:12px;margin-bottom:28px}.ram-ai-logo{width:48px;height:48px;border-radius:15px;object-fit:cover;box-shadow:0 0 28px rgba(41,216,255,.18)}.ram-ai-brand strong{display:block;font-size:21px}.ram-ai-brand small{color:#7ea0af}.ram-ai-kicker{color:#2edcff;font-size:12px;letter-spacing:.08em}.ram-ai-side h1{font-size:24px;line-height:1.45;margin:8px 0 12px}.ram-ai-side p{color:#8eacb9;line-height:1.9;font-size:13px}.ram-ai-user{margin-top:12px;padding:14px;border-radius:17px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.06)}.ram-ai-user strong,.ram-ai-user small{display:block}.ram-ai-user small{color:#58d8e8;margin-top:5px}.ram-ai-privacy{margin-top:auto;padding:14px;border-radius:17px;background:rgba(255,191,71,.055);border:1px solid rgba(255,191,71,.14);font-size:12px;line-height:1.8;color:#d4c49e}.ram-ai-back{display:inline-flex;margin-top:14px;color:#91b7c5;text-decoration:none;font-size:13px}.ram-ai-chat{display:flex;flex-direction:column;overflow:hidden}.ram-ai-head{padding:22px 24px;border-bottom:1px solid rgba(255,255,255,.07);display:flex;align-items:center;justify-content:space-between}.ram-ai-head div strong{display:block;font-size:18px}.ram-ai-head div small{color:#7e9daa}.ram-ai-live{display:flex;align-items:center;gap:8px;color:#55e0b3;font-size:12px}.ram-ai-live i{width:8px;height:8px;border-radius:50%;background:#55e0b3;box-shadow:0 0 16px #55e0b3}.ram-ai-messages{flex:1;overflow:auto;padding:28px;display:flex;flex-direction:column;gap:16px;min-height:480px}.ram-ai-message{max-width:82%;padding:15px 17px;border-radius:18px;line-height:1.9;font-size:14px;white-space:pre-wrap}.ram-ai-message.assistant{align-self:flex-start;background:rgba(28,207,235,.075);border:1px solid rgba(60,221,245,.12);color:#dffaff;border-bottom-right-radius:6px}.ram-ai-message.user{align-self:flex-end;background:linear-gradient(135deg,rgba(36,174,235,.22),rgba(97,72,235,.23));border:1px solid rgba(116,174,255,.18);border-bottom-left-radius:6px}.ram-ai-thinking{color:#72ddef;font-size:13px;padding:0 30px 10px}.ram-ai-error{margin:0 24px 12px;padding:11px 14px;border-radius:14px;background:rgba(255,83,99,.08);border:1px solid rgba(255,83,99,.18);color:#ffadb5;font-size:13px}.ram-ai-quick{padding:0 24px 14px;display:flex;gap:8px;overflow:auto}.ram-ai-quick button{white-space:nowrap;border:1px solid rgba(76,216,241,.13);background:rgba(255,255,255,.025);color:#9bc8d5;border-radius:999px;padding:9px 12px;cursor:pointer;font-family:inherit;font-size:12px}.ram-ai-quick button:hover{border-color:rgba(76,216,241,.35);color:#e4fbff}.ram-ai-form{padding:16px 20px 20px;border-top:1px solid rgba(255,255,255,.07);display:grid;grid-template-columns:1fr auto;gap:10px}.ram-ai-form textarea{resize:none;min-height:58px;max-height:150px;border-radius:17px;border:1px solid rgba(99,217,241,.16);background:rgba(0,0,0,.18);color:#ecfbff;padding:14px 15px;font:14px/1.7 Tahoma,Arial,sans-serif;outline:none}.ram-ai-form textarea:focus{border-color:rgba(48,218,247,.42);box-shadow:0 0 0 3px rgba(48,218,247,.06)}.ram-ai-form button{border:0;border-radius:17px;min-width:92px;padding:0 18px;background:linear-gradient(135deg,#1dd5ee,#2187ff);color:#031016;font-weight:800;font-family:inherit;cursor:pointer}.ram-ai-form button:disabled{opacity:.45;cursor:not-allowed}@media(max-width:820px){.ram-ai-shell{padding:12px}.ram-ai-frame{grid-template-columns:1fr;min-height:calc(100vh - 24px)}.ram-ai-side{display:none}.ram-ai-chat{min-height:calc(100vh - 24px);border-radius:20px}.ram-ai-messages{padding:18px}.ram-ai-message{max-width:92%}.ram-ai-form{padding:12px}.ram-ai-quick{padding:0 12px 12px}.ram-ai-head{padding:18px}}
      `}</style>
      <div className="ram-ai-frame">
        <aside className="ram-ai-side">
          <div className="ram-ai-brand">
            <img className="ram-ai-logo" src="/ram-brand.jpg" alt="RAM" />
            <div><strong>RAM AI</strong><small>Clinical Operations Intelligence</small></div>
          </div>
          <span className="ram-ai-kicker">دستیار هوشمند مدیریت</span>
          <h1>مرکز تصمیم‌گیری هوشمند کلینیک رام</h1>
          <p>نسخه نخست روی تحلیل، برنامه‌ریزی و پیشنهاد مدیریتی متمرکز است و هنوز بدون تأیید شما هیچ تغییری در پرونده‌ها یا امور مالی انجام نمی‌دهد.</p>
          <div className="ram-ai-user"><strong>{displayName}</strong><small>{role}</small></div>
          <div className="ram-ai-privacy">برای حفظ محرمانگی، در گفت‌وگو کد ملی، شماره تماس یا سایر شناسه‌های مستقیم بیمار را وارد نکنید.</div>
          <a className="ram-ai-back" href="/">← بازگشت به سامانه اصلی</a>
        </aside>

        <section className="ram-ai-chat">
          <header className="ram-ai-head">
            <div><strong>دستیار رام</strong><small>تحلیل عملیاتی با context زنده‌ی تجمیعی</small></div>
            <span className="ram-ai-live"><i /> آنلاین</span>
          </header>

          <div className="ram-ai-messages" aria-live="polite">
            {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`ram-ai-message ${message.role}`}>{message.text}</div>)}
          </div>
          {busy && <div className="ram-ai-thinking">در حال تحلیل داده‌های کلینیک…</div>}
          {error && <div className="ram-ai-error">{error}</div>}

          <div className="ram-ai-quick">
            {quickPrompts.map((prompt) => <button key={prompt} onClick={() => void ask(prompt)} disabled={busy}>{prompt}</button>)}
          </div>

          <form className="ram-ai-form" onSubmit={submit}>
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="مثلاً: با توجه به وضعیت امروز، سه اقدام مهم مدیر را اولویت‌بندی کن…" maxLength={4000} />
            <button type="submit" disabled={busy || !draft.trim()}>{busy ? "…" : "ارسال"}</button>
          </form>
        </section>
      </div>
    </main>
  );
}
