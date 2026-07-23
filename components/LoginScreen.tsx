"use client";

import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { Icon, IconSprite } from "./icons";
import { useI18n } from "@/lib/i18n";

/** Login screen — ported from the latest design (design/login.html). */

const TYPE_SPEED_MS = 42;

export default function LoginScreen() {
  const { t } = useI18n();
  const title = t("login.title");
  const [loading, setLoading] = useState(false);
  const [typedN, setTypedN] = useState(0);

  const spotRef = useRef<HTMLDivElement>(null);
  const parARefs = useRef<(HTMLDivElement | null)[]>([]);
  const parBRef = useRef<HTMLDivElement>(null);

  // Typewriter title, restarting if the language (and thus the title) changes.
  // Reduced motion → show the full title immediately.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTypedN(title.length);
      return;
    }
    setTypedN(0);
    const id = setInterval(() => {
      setTypedN((n) => {
        if (n + 1 >= title.length) clearInterval(id);
        return Math.min(n + 1, title.length);
      });
    }, TYPE_SPEED_MS);
    return () => clearInterval(id);
  }, [title]);

  function handleMicrosoft() {
    setLoading(true);
    signIn("microsoft-entra-id", { callbackUrl: "/dashboard" });
  }

  // Mouse spotlight + two-depth parallax over the hero.
  function onHeroMouse(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    if (spotRef.current) {
      spotRef.current.style.left = `${e.clientX - r.left}px`;
      spotRef.current.style.top = `${e.clientY - r.top}px`;
    }
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    for (const el of parARefs.current) {
      if (el) el.style.transform = `translate(${nx * -14}px,${ny * -10}px)`;
    }
    if (parBRef.current) {
      parBRef.current.style.transform = `translate(${nx * -30}px,${ny * -22}px)`;
    }
  }

  function onHeroLeave() {
    for (const el of parARefs.current) {
      if (el) el.style.transform = "";
    }
    if (parBRef.current) parBRef.current.style.transform = "";
  }

  // Magnetic sign-in button.
  function onMagnet(e: React.MouseEvent<HTMLButtonElement>) {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate(${dx * 0.12}px,${dy * 0.18}px)`;
  }

  function onMagnetLeave(e: React.MouseEvent<HTMLButtonElement>) {
    e.currentTarget.style.transform = "";
  }

  const caretOff = typedN >= title.length;

  return (
    <div className="root ui" style={{ ["--accent" as string]: "#2f80d8" }}>
      <IconSprite />
      <div className="lhero" onMouseMove={onHeroMouse} onMouseLeave={onHeroLeave}>
        <div className="spot" ref={spotRef} />

        <div className="l3d">
          <div
            className="par"
            ref={(el) => {
              parARefs.current[0] = el;
            }}
          >
            <div className="l3d-glow" />
          </div>
          <div className="par" ref={parBRef}>
            <div className="hero-tile">
              <img className="tile-mark" src="/petabyte-mark-hd.png" alt="" />
            </div>
          </div>
          <div
            className="par"
            ref={(el) => {
              parARefs.current[1] = el;
            }}
          >
            <div className="chip c1">
              <Icon name="data" className="ic24" />
            </div>
            <div className="chip c2">
              <Icon name="monitor" className="ic24" />
            </div>
            <div className="chip c3">
              <Icon name="shield" className="ic24" />
            </div>
            <div className="chip c4">
              <Icon name="cloud" className="ic18" />
            </div>
          </div>
        </div>

        <header className="lnav">
          <div className="lnav-brand">
            <span
              className="markimg"
              role="img"
              aria-label="Petabyte"
              style={{ width: 30, height: 30 }}
            />
            <span className="lnav-name">PETABYTE</span>
          </div>
        </header>

        <main className="lmain">
          <h1 className="l-title fx">
            {title.slice(0, typedN)}
            <span className={`caret ${caretOff ? "off" : ""}`} />
          </h1>
          <p className="l-p fx">{t("login.blurb")}</p>
          <div className="l-cta fx">
            <button
              className="l-ms"
              disabled={loading}
              onClick={handleMicrosoft}
              onMouseMove={onMagnet}
              onMouseLeave={onMagnetLeave}
            >
              {loading ? (
                <svg className="ic18 spin" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    fill="none"
                    stroke="rgba(255,255,255,.6)"
                    strokeWidth="2.5"
                    strokeDasharray="40 60"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg className="ic16" viewBox="0 0 23 23">
                  <path fill="#F25022" d="M1 1h10v10H1z" />
                  <path fill="#7FBA00" d="M12 1h10v10H12z" />
                  <path fill="#00A4EF" d="M1 12h10v10H1z" />
                  <path fill="#FFB900" d="M12 12h10v10H12z" />
                </svg>
              )}
              {t("login.cta")}
              <Icon name="arrow" className="ic14" />
            </button>
            <div className="l-lock">
              <span className="l-lockcircle">
                <Icon name="lock" className="ic18" />
              </span>
              <span className="l-locktxt">
                {t("login.ssoProtected")}
                <br />
                {t("login.domainOnly")}
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
