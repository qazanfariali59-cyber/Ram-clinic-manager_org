"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const SEEN_KEY = "ram-intro-seen-v1";

export default function RamIntro() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (sessionStorage.getItem(SEEN_KEY) || reduced) return;

    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const openFrame = window.requestAnimationFrame(() => setVisible(true));
    const timer = window.setTimeout(() => {
      sessionStorage.setItem(SEEN_KEY, "1");
      setVisible(false);
      document.documentElement.style.overflow = previousOverflow;
    }, 5200);

    return () => {
      window.cancelAnimationFrame(openFrame);
      window.clearTimeout(timer);
      document.documentElement.style.overflow = previousOverflow;
    };
  }, []);

  function close() {
    sessionStorage.setItem(SEEN_KEY, "1");
    document.documentElement.style.overflow = "";
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="ram-intro" role="presentation">
      <style>{`
        .ram-intro{position:fixed;inset:0;z-index:9999;overflow:hidden;background:radial-gradient(circle at 50% 44%,rgba(23,123,176,.15),transparent 24%),radial-gradient(circle at 50% 52%,rgba(103,66,219,.10),transparent 32%),#03080d;isolation:isolate;animation:ramIntroExit .72s cubic-bezier(.72,0,.3,1) 4.5s forwards}.ram-intro:before{content:"";position:absolute;inset:-18%;background:repeating-linear-gradient(90deg,transparent 0 83px,rgba(91,213,236,.025) 84px),repeating-linear-gradient(0deg,transparent 0 83px,rgba(91,213,236,.018) 84px);transform:perspective(800px) rotateX(66deg) translateY(31%);opacity:.5}.ram-intro-stage{position:absolute;inset:0;display:grid;place-items:center;perspective:1100px}.ram-intro-orbit{position:relative;width:min(76vw,620px);aspect-ratio:1;transform-style:preserve-3d;animation:ramOrbit 3.2s cubic-bezier(.45,.03,.19,.99) both}.ram-intro-svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;filter:drop-shadow(0 0 10px rgba(42,221,241,.45)) drop-shadow(0 0 28px rgba(84,100,255,.22));animation:ramSvgResolve 4.1s cubic-bezier(.4,0,.2,1) both}.ram-ribbon{fill:none;stroke-linecap:round;stroke-width:2.2;vector-effect:non-scaling-stroke;stroke-dasharray:10 8;animation:ramDash .75s linear infinite,ramRibbonResolve 3.25s cubic-bezier(.52,.02,.12,1) both}.ram-ribbon.a{stroke:#2de0ef}.ram-ribbon.b{stroke:#2b8bff;animation-delay:.08s}.ram-ribbon.c{stroke:#745dff;animation-delay:.13s}.ram-ribbon.d{stroke:#61f4dd;animation-delay:.18s}.ram-ribbon.e{stroke:#39b7ff;animation-delay:.22s}.ram-core{position:absolute;inset:24%;border-radius:50%;background:radial-gradient(circle,rgba(54,225,241,.13),rgba(54,129,255,.05) 42%,transparent 66%);filter:blur(7px);animation:ramPulse 1.25s ease-in-out infinite,ramCoreShrink 3.65s ease-in-out both}.ram-logo{position:absolute;width:min(36vw,258px);aspect-ratio:1;display:grid;place-items:center;opacity:0;transform:translateZ(65px) scale(.54) rotateY(-18deg);animation:ramLogoIn 1.45s cubic-bezier(.18,.85,.22,1) 3.05s forwards}.ram-logo:before{content:"";position:absolute;inset:8%;border-radius:28%;background:radial-gradient(circle,rgba(60,226,243,.28),rgba(75,78,255,.08) 42%,transparent 70%);filter:blur(22px);transform:translateZ(-1px)}.ram-logo img{position:relative;width:100%;height:100%;object-fit:cover;border-radius:28%;box-shadow:0 32px 90px rgba(0,0,0,.6),0 0 42px rgba(49,211,237,.16)}.ram-shine{position:absolute;width:44%;height:1px;background:linear-gradient(90deg,transparent,#abf8ff,transparent);opacity:0;filter:blur(.3px);animation:ramShine 1.1s ease 3.52s forwards}.ram-particle{position:absolute;width:3px;height:3px;border-radius:50%;background:#7cefff;box-shadow:0 0 14px #45ddec;opacity:0;animation:ramParticle 3.2s ease-out var(--d) both}.ram-skip{position:absolute;right:24px;bottom:22px;z-index:5;border:1px solid rgba(142,227,241,.14);background:rgba(7,18,27,.52);color:#6f94a0;border-radius:999px;padding:8px 13px;font:11px Tahoma,Arial,sans-serif;cursor:pointer;backdrop-filter:blur(12px);transition:.2s}.ram-skip:hover{color:#dffbff;border-color:rgba(142,227,241,.32)}
        @keyframes ramOrbit{0%{transform:rotateY(0deg) rotateX(10deg) scale(.9)}20%{transform:rotateY(78deg) rotateX(-3deg) scale(1.12)}48%{transform:rotateY(190deg) rotateX(8deg) scale(.94)}76%{transform:rotateY(302deg) rotateX(-4deg) scale(1.08)}100%{transform:rotateY(360deg) rotateX(0) scale(.82)}}@keyframes ramDash{to{stroke-dashoffset:-36}}@keyframes ramRibbonResolve{0%{opacity:.95;stroke-width:2.35;transform-origin:center;transform:scale(.62) rotate(24deg)}42%{opacity:1;stroke-width:2.15;transform:scale(1.08) rotate(-10deg)}78%{opacity:.72;stroke-width:1.4;transform:scale(.82) rotate(0)}100%{opacity:0;stroke-width:.8;transform:scale(.46)}}@keyframes ramSvgResolve{0%{transform:rotate(0deg) scale(.94)}48%{transform:rotate(-23deg) scale(1.07)}82%{transform:rotate(2deg) scale(.82)}100%{transform:rotate(0) scale(.58)}}@keyframes ramPulse{50%{transform:scale(1.16);opacity:.55}}@keyframes ramCoreShrink{0%,48%{opacity:1}100%{opacity:.1;transform:scale(.45)}}@keyframes ramLogoIn{0%{opacity:0;transform:translateZ(65px) scale(.54) rotateY(-18deg);filter:blur(8px)}55%{opacity:1;transform:translateZ(86px) scale(1.05) rotateY(4deg);filter:blur(0)}100%{opacity:1;transform:translateZ(76px) scale(1) rotateY(0);filter:blur(0)}}@keyframes ramShine{0%{opacity:0;transform:translateY(-150px) rotate(-28deg) scaleX(.5)}32%{opacity:.92}100%{opacity:0;transform:translateY(130px) rotate(-28deg) scaleX(1.6)}}@keyframes ramParticle{0%{opacity:0;transform:translate(0,0) scale(.3)}20%{opacity:.85}100%{opacity:0;transform:translate(var(--x),var(--y)) scale(1.5)}}@keyframes ramIntroExit{to{opacity:0;visibility:hidden;transform:scale(1.025)}}
        @media(max-width:640px){.ram-intro-orbit{width:92vw}.ram-logo{width:48vw}.ram-skip{right:14px;bottom:14px}}@media(prefers-reduced-motion:reduce){.ram-intro{display:none}}
      `}</style>
      <div className="ram-intro-stage">
        <div className="ram-intro-orbit">
          <div className="ram-core" />
          <svg className="ram-intro-svg" viewBox="0 0 600 600" aria-hidden="true">
            <path className="ram-ribbon a" d="M89 330C149 165 387 108 487 221C559 302 420 396 317 287C239 203 112 299 197 418C259 505 447 454 508 335" />
            <path className="ram-ribbon b" d="M111 221C224 99 465 161 475 302C486 447 280 497 192 384C118 289 246 177 357 247C467 316 445 452 302 470" />
            <path className="ram-ribbon c" d="M79 392C143 505 348 522 461 405C564 300 448 150 302 178C169 203 129 360 238 430C344 499 489 397 453 274" />
            <path className="ram-ribbon d" d="M151 118C268 169 341 121 440 202C560 300 479 477 330 482C172 487 108 334 174 232C232 143 397 157 439 292" />
            <path className="ram-ribbon e" d="M96 285C185 235 169 108 311 112C475 116 544 262 466 379C386 499 192 475 137 360C93 268 236 207 330 287C399 345 370 443 275 459" />
          </svg>
          {[0,1,2,3,4,5,6,7,8,9,10,11].map((i) => (
            <i key={i} className="ram-particle" style={{ "--d": `${0.35 + i * 0.11}s`, "--x": `${(i % 2 ? 1 : -1) * (70 + i * 11)}px`, "--y": `${((i % 3) - 1) * (55 + i * 7)}px` } as React.CSSProperties} />
          ))}
        </div>
        <div className="ram-logo">
          <Image src="/ram-brand.jpg" alt="RAM" width={320} height={320} priority />
          <div className="ram-shine" />
        </div>
      </div>
      <button className="ram-skip" type="button" onClick={close}>رد شدن از موشن</button>
    </div>
  );
}
