"use client";

import { useState } from "react";
import Link from "next/link";

/* ── Icons ───────────────────────────────────────────────────── */
const IconInstagram = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
  </svg>
);

const IconFacebook = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="none"
  >
    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
  </svg>
);

const IconWhatsapp = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="none"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const IconTiktok = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.79 1.54V6.79a4.85 4.85 0 01-1.02-.1z" />
  </svg>
);

const IconMail = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const IconPhone = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81 19.79 19.79 0 01.01 2.18 2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z" />
  </svg>
);

const IconArrow = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconSpinner = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    className="ft-spin"
  >
    <path d="M21 12a9 9 0 11-6.219-8.56" />
  </svg>
);

/* ── Footer ──────────────────────────────────────────────────── */
export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [existingSubscriber, setExistingSubscriber] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;

    setLoading(true);
    setError("");
    setExistingSubscriber(false);

    try {
      const res = await fetch(`${API_URL}/subscribers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 || data.message?.toLowerCase().includes("already exists") || data.message?.toLowerCase().includes("exists")) {
          setExistingSubscriber(true);
          setEmail("");
          return;
        }
        setError(data.message || "Something went wrong");
        return;
      }

      setSubscribed(true);
      setEmail("");
    } catch (err) {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>

      <footer className="ft-root" role="contentinfo">
        {/* ── Gold top border ── */}
        <div className="ft-gold-bar" aria-hidden="true" />

        {/* ══════════ MAIN BODY ══════════ */}
        <div className="ft-body">
          <div className="ft-grid">
            {/* ── Col 1: Brand ── */}
            <div className="ft-col ft-col-brand">
              <div className="ft-brand-lockup">
                <h2 className="ft-brand-name">
                  AIR
                  <br />
                  COLLECTION
                </h2>
              </div>
              <p className="ft-brand-desc">
                Fashion tayo sare leh oo loogu talagalay dunida casriga ah. Waxaan isku darnaa naqshad casri ah iyo tayo aan la tartami karin si aan kuu siino khibrad labis oo aan caadi ahayn.  
              </p>
              <div className="ft-social" aria-label="Follow us">
                {[
                  { href: "https://www.instagram.com/air__collection_?igsh=MXJzNWtyNWUzNHludw%3D%3D&utm_source=qr", label: "Instagram", Icon: IconInstagram },
                  { href: "https://www.facebook.com/share/1RK2rZcmsa/?mibextid=wwXIfr", label: "Facebook", Icon: IconFacebook },
                  { href: "https://wa.me/+252634818551", label: "WhatsApp", Icon: IconWhatsapp },
                  { href: "https://www.tiktok.com/@aircollection1?_r=1&_t=ZS-97CPD7QFEmr", label: "TikTok", Icon: IconTiktok },
                ].map(({ href, label, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="ft-social-btn"
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            </div>

            {/* ── Col 2: Quick Links ── */}
            <div className="ft-col">
              <h3 className="ft-heading">Quick Links</h3>
              <nav aria-label="Quick links">
                <ul className="ft-links">
                  {[
                    ["/products", "All Products"],
                    ["/about", "About Us"],
                    ["/contact", "Contact"],
                  ].map(([href, label]) => (
                    <li key={href}>
                      <Link href={href} className="ft-link">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* ── Col 3: Customer Service ── */}
            <div className="ft-col">
              <h3 className="ft-heading">Customer Service</h3>
              <nav aria-label="Customer service">
                <ul className="ft-links">
                  {[
                    ["/wishlist", "Wishlist"],
                    ["/cart", "Cart"],
                  ].map(([href, label]) => (
                    <li key={href}>
                      <Link href={href} className="ft-link">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* ── Col 4: Contact + Newsletter ── */}
            <div className="ft-col">
              <h3 className="ft-heading">Contact</h3>
              <ul className="ft-contact">
                <li>
                  <a
                    href="mailto:support@aircollection.com"
                    className="ft-contact-row"
                  >
                    <span className="ft-contact-ico">
                      <IconMail />
                    </span>
                    aircollection05@gmail.com
                  </a>
                </li>
                <li>
                  <a href="tel:+12345678901" className="ft-contact-row">
                    <span className="ft-contact-ico">
                      <IconPhone />
                    </span>
                    +252 63 4818551
                  </a>
                </li>
                <li>
                  <a
                    href="https://maps.app.goo.gl/jjjnpG9H46hy9urd8?g_st=iw"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ft-contact-row"
                  >
                    <span className="ft-contact-ico">
                      📍
                    </span>
                    View on Google Maps
                  </a>
                </li>
              </ul>

              <div className="ft-newsletter-block">
                <h3 className="ft-heading" style={{ marginBottom: "6px" }}>
                  Newsletter
                </h3>
                <p className="ft-newsletter-caption">
                  Exclusive drops & early access.
                </p>
                {subscribed ? (
                  <div className="ft-subscribed" role="status">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      width="13"
                      height="13"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    You're in. Welcome to the universe.
                  </div>
                ) : existingSubscriber ? (
                  <div className="ft-subscribed" role="status" style={{ color: '#b8965a' }}>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      width="13"
                      height="13"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    You're already part of the Air Collection universe! ❤️
                  </div>
                ) : (
                  <form onSubmit={handleSubscribe} className="ft-form" noValidate>
                    <label htmlFor="ft-nl-email" className="ft-sr">
                      Email address
                    </label>
                    <input
                      id="ft-nl-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your email address"
                      required
                      className="ft-input"
                      autoComplete="email"
                      disabled={loading}
                    />
                    <button
                      type="submit"
                      className="ft-form-btn"
                      aria-label="Subscribe"
                      disabled={loading}
                    >
                      {loading ? <IconSpinner /> : <IconArrow />}
                    </button>
                  </form>
                )}
                {error && <p className="ft-error">{error}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════ BOTTOM BAR ══════════ */}
        <div className="ft-bottom">
          <div className="ft-bottom-inner">
            <p className="ft-copy">
              © {new Date().getFullYear()} Air Collection. All rights reserved.
            </p>
            <div className="ft-bottom-right">
              <span className="ft-credit">
                Developed by{" "}
                <Link
                  href="https://wa.me/8801341933649"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ft-credit-link"
                >
                  Sharmarke Abdi
                </Link>
                <span className="ft-credit-separator" aria-hidden="true">
                  &
                </span>
                <Link
                  href="https://github.com/sifathossain-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ft-credit-link"
                >
                  Sifat Hossain
                </Link>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   CSS — Air Collection Footer
   Design tokens
   ─────────────────────────────────────────────────────────────
   bg            #0a0908   near-black, warm undertone
   surface       rgba(255,255,255,.025)   glass card fill
   line          rgba(255,255,255,.06)    hairline borders
   ink           #f2ede2   headline text
   ink-soft      #a49c8d   body text
   ink-faint     #5c574c   tertiary / copyright
   gold          #c9a769   accent (used sparingly)
   gold-bright   #e3c48c   accent hover state
   Display face: Cormorant Garamond (serif, luxury editorial)
   Body face:    Jost (geometric sans, clean + modern)
══════════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Jost:wght@300;400;500;600&display=swap');

.ft-sr {
  position:absolute;width:1px;height:1px;padding:0;margin:-1px;
  overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;
}

/* ═══════════════════════ 1. ROOT / BACKGROUND ═══════════════════════ */
.ft-root {
  --bg: #0a0908;
  --surface: rgba(255,255,255,0.025);
  --surface-hover: rgba(255,255,255,0.045);
  --line: rgba(255,255,255,0.065);
  --line-soft: rgba(255,255,255,0.035);
  --ink: #f2ede2;
  --ink-soft: #a49c8d;
  --ink-faint: #5c574c;
  --gold: #c9a769;
  --gold-bright: #e3c48c;
  --gold-glow: rgba(201,167,105,0.16);

  font-family: 'Jost', sans-serif;
  background: var(--bg);
  color: var(--ink);
  position: relative;
  -webkit-font-smoothing: antialiased;
  overflow: hidden;
  isolation: isolate;
}

/* ambient luxury glow — two soft radial pools, gold whisper-quiet */
.ft-root::before {
  content: '';
  position: absolute;
  bottom: -180px; left: -120px;
  width: 620px; height: 620px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(201,167,105,0.07) 0%, transparent 68%);
  pointer-events: none;
  z-index: 0;
}
.ft-root::after {
  content: '';
  position: absolute;
  top: -140px; right: -160px;
  width: 480px; height: 480px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(201,167,105,0.045) 0%, transparent 65%);
  pointer-events: none;
  z-index: 0;
}

/* ═══════════════════════ 2. TOP GOLD DIVIDER ═══════════════════════ */
.ft-gold-bar {
  height: 1px;
  position: relative;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(201,167,105,0.22) 12%,
    rgba(227,196,140,0.85) 50%,
    rgba(201,167,105,0.22) 88%,
    transparent 100%
  );
}
.ft-gold-bar::after {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 8px;
  top: -3.5px;
  background: linear-gradient(90deg, transparent 30%, rgba(201,167,105,0.35) 50%, transparent 70%);
  filter: blur(4px);
  opacity: 0.6;
}

/* ═══════════════════════ 3. BODY / GRID ═══════════════════════ */
.ft-body {
  padding: clamp(60px,7.5vw,104px) clamp(26px,5.5vw,92px) clamp(48px,6.5vw,76px);
  position: relative;
  z-index: 1;
}

.ft-grid {
  display: grid;
  grid-template-columns: 1.9fr 1fr 1fr 1.6fr;
  gap: clamp(32px,4.5vw,64px);
  align-items: start;
}

/* ═══════════════════════ 4. BRAND COLUMN ═══════════════════════ */
.ft-brand-lockup {
  margin-bottom: 22px;
}

.ft-brand-name {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: clamp(1.7rem, 2.3vw, 2.3rem);
  font-weight: 500;
  letter-spacing: 0.24em;
  color: var(--ink);
  line-height: 1.12;
  margin: 0;
  background: linear-gradient(180deg, #ffffff 0%, var(--ink) 55%, var(--gold) 140%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.ft-brand-desc {
  font-size: 0.83rem;
  color: var(--ink-soft);
  line-height: 1.9;
  max-width: 300px;
  margin: 0 0 30px;
  font-weight: 300;
  letter-spacing: 0.01em;
}

/* ═══════════════════════ 5. SOCIAL ICONS ═══════════════════════ */
.ft-social { display: flex; gap: 11px; }
.ft-social-btn {
  width: 38px; height: 38px;
  border-radius: 50%;
  border: 1px solid var(--line);
  background: var(--surface);
  display: flex; align-items: center; justify-content: center;
  color: var(--ink-soft);
  text-decoration: none;
  transition: border-color .3s ease, color .3s ease, background .3s ease,
              transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease;
}
.ft-social-btn:hover {
  border-color: rgba(201,167,105,0.55);
  color: var(--gold-bright);
  background: linear-gradient(145deg, rgba(201,167,105,0.14), rgba(201,167,105,0.03));
  transform: translateY(-3px);
  box-shadow: 0 8px 20px -8px rgba(201,167,105,0.35);
}
.ft-social-btn:focus-visible {
  outline: 1.5px solid var(--gold);
  outline-offset: 2px;
}

/* ═══════════════════════ 6. COLUMN HEADINGS & LINKS ═══════════════════════ */
.ft-heading {
  font-size: 0.66rem;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--gold);
  margin: 0 0 22px;
  position: relative;
  display: inline-block;
}

.ft-links {
  list-style: none;
  padding: 0; margin: 0;
  display: flex; flex-direction: column; gap: 13px;
}
.ft-link {
  font-size: 0.85rem;
  font-weight: 300;
  color: var(--ink-soft);
  text-decoration: none;
  position: relative;
  display: inline-block;
  letter-spacing: 0.015em;
  transition: color .3s ease;
}
.ft-link::after {
  content: '';
  position: absolute;
  bottom: -2px; left: 0;
  width: 0; height: 1px;
  background: linear-gradient(90deg, var(--gold), var(--gold-bright));
  transition: width .35s cubic-bezier(.22,1,.36,1);
  border-radius: 99px;
}
.ft-link:hover { color: var(--ink); }
.ft-link:hover::after { width: 100%; }

/* ═══════════════════════ 7. CONTACT ═══════════════════════ */
.ft-contact {
  list-style: none;
  padding: 0; margin: 0 0 32px;
  display: flex; flex-direction: column; gap: 12px;
}
.ft-contact-row {
  display: flex; align-items: center; gap: 11px;
  font-size: 0.8rem; font-weight: 300;
  color: var(--ink-soft);
  text-decoration: none;
  transition: color .3s ease;
  word-break: break-all;
}
.ft-contact-row:hover { color: var(--ink); }
.ft-contact-row:hover .ft-contact-ico {
  border-color: rgba(201,167,105,0.5);
  color: var(--gold-bright);
  background: rgba(201,167,105,0.08);
}
.ft-contact-ico {
  width: 29px; height: 29px;
  border-radius: 8px;
  background: var(--surface);
  border: 1px solid var(--line);
  display: flex; align-items: center; justify-content: center;
  color: var(--gold);
  flex-shrink: 0;
  font-size: 0.75rem;
  transition: border-color .3s ease, color .3s ease, background .3s ease;
}

/* ═══════════════════════ 8. NEWSLETTER ═══════════════════════ */
.ft-newsletter-caption {
  font-size: 0.78rem; color: var(--ink-faint); font-weight: 300;
  margin: 0 0 14px;
  letter-spacing: 0.01em;
}

.ft-form {
  display: flex; align-items: center;
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
  background: var(--surface);
  backdrop-filter: blur(6px);
  transition: border-color .3s ease, box-shadow .3s ease, background .3s ease;
}
.ft-form:focus-within {
  border-color: rgba(201,167,105,0.5);
  background: rgba(201,167,105,0.03);
  box-shadow: 0 0 0 4px rgba(201,167,105,0.08), 0 10px 28px -14px rgba(201,167,105,0.4);
}
.ft-input {
  flex: 1; background: transparent; border: none; outline: none;
  padding: 12px 15px;
  font-size: 0.95rem;
  font-family: 'Jost', sans-serif;
  font-weight: 300;
  color: var(--ink);
  min-width: 0;
  letter-spacing: 0.01em;
}
.ft-input::placeholder { color: #423e37; }
.ft-input:disabled { opacity: 0.6; }

.ft-form-btn {
  width: 40px; height: 40px; flex-shrink: 0;
  background: linear-gradient(155deg, var(--gold-bright), var(--gold));
  border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: #171310;
  margin: 3px;
  border-radius: 9px;
  transition: filter .25s ease, transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s ease;
}
.ft-form-btn:hover {
  filter: brightness(1.08);
  transform: scale(1.06);
  box-shadow: 0 6px 18px -6px rgba(201,167,105,0.55);
}
.ft-form-btn:disabled {
  background: #4a4437;
  color: #8a8478;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.ft-subscribed {
  display: flex; align-items: center; gap: 9px;
  font-size: 0.79rem; color: #8fd0ac;
  padding: 11px 14px;
  background: rgba(143,208,172,0.06);
  border: 1px solid rgba(143,208,172,0.18);
  border-radius: 10px;
  animation: ft-pop .45s cubic-bezier(.22,1,.36,1) both;
}
@keyframes ft-pop {
  from { opacity:0; transform:translateY(6px); }
  to   { opacity:1; transform:translateY(0); }
}

.ft-error {
  font-size: 0.74rem;
  color: #e2917a;
  margin: 9px 0 0;
  font-weight: 300;
  letter-spacing: 0.01em;
}

.ft-spin { animation: ft-spin-rotate 0.85s linear infinite; }
@keyframes ft-spin-rotate {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* ═══════════════════════ 9. BOTTOM BAR ═══════════════════════ */
.ft-bottom {
  border-top: 1px solid var(--line-soft);
  background: linear-gradient(180deg, transparent, rgba(0,0,0,0.15));
  position: relative;
  z-index: 1;
}
.ft-bottom-inner {
  display: flex; align-items: center;
  justify-content: space-between;
  flex-wrap: wrap; gap: 12px;
  padding: 20px clamp(26px,5.5vw,92px);
}
.ft-copy {
  font-size: 0.72rem; color: var(--ink-soft);
  margin: 0; font-weight: 300; letter-spacing: 0.05em;
  transition: color .3s ease;
}
.ft-copy:hover { color: var(--ink); }

.ft-bottom-right {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
}
.ft-credit {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
  font-size: 0.72rem;
  color: var(--ink-soft);
  font-weight: 300;
  letter-spacing: 0.045em;
  line-height: 1.7;
}
.ft-credit-link {
  color: var(--gold);
  text-decoration: none;
  font-weight: 500;
  letter-spacing: 0.06em;
  position: relative;
  transition: color .25s ease, text-shadow .25s ease;
}
.ft-credit-link::after {
  content: '';
  position: absolute;
  left: 0; right: 0; bottom: -2px;
  height: 1px;
  background: currentColor;
  opacity: 0.35;
  transform: scaleX(0);
  transform-origin: right;
  transition: transform .28s ease, opacity .28s ease;
}
.ft-credit-link:hover {
  color: var(--gold-bright);
  text-shadow: 0 0 18px rgba(201,167,105,0.28);
}
.ft-credit-link:hover::after {
  opacity: 0.8;
  transform: scaleX(1);
  transform-origin: left;
}
.ft-credit-separator { color: var(--ink-faint); margin: 0 2px; }

.ft-blink {
  font-size: 0.7rem; color: var(--ink-soft); text-decoration: none;
  font-weight: 300; letter-spacing: 0.04em;
  transition: color .25s ease;
}
.ft-blink:hover { color: var(--ink); }
.ft-pipe {
  display: inline-block; width: 1px; height: 10px;
  background: var(--line); vertical-align: middle;
}
.ft-loc {
  font-size: 0.7rem; color: #211f1b;
  letter-spacing: 0.12em; font-weight: 300; text-transform: uppercase;
}

/* ═══════════════════════ 10. RESPONSIVE ═══════════════════════ */
@media (max-width: 1024px) {
  .ft-grid {
    grid-template-columns: 1.4fr 1fr 1fr;
    row-gap: 44px;
  }
  .ft-grid > .ft-col:last-child {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 36px;
    align-items: start;
  }
}

@media (max-width: 768px) {
  .ft-grid {
    grid-template-columns: 1fr 1fr;
    gap: 38px 30px;
  }
  .ft-col-brand { grid-column: 1 / -1; }
  .ft-brand-desc { max-width: 100%; }
  .ft-grid > .ft-col:last-child {
    grid-column: 1 / -1;
    grid-template-columns: 1fr 1fr;
  }
  .ft-bottom-inner { flex-direction: column; align-items: flex-start; gap: 9px; }
  .ft-credit { justify-content: flex-start; }
}

/* Mobile: compact, two-column layout instead of one long stacked column */
@media (max-width: 520px) {
  .ft-body { padding: 40px 20px 30px; }

  .ft-grid {
    grid-template-columns: 1fr 1fr;
    gap: 30px 20px;
    row-gap: 32px;
  }

  .ft-col-brand { grid-column: 1 / -1; }
  .ft-brand-lockup { margin-bottom: 14px; }
  .ft-brand-name { font-size: 1.5rem; }

  .ft-brand-desc {
    font-size: 0.78rem;
    line-height: 1.65;
    max-width: 100%;
    margin: 0 0 18px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .ft-social { gap: 8px; }
  .ft-social-btn { width: 34px; height: 34px; }

  .ft-grid > .ft-col:last-child {
    grid-column: 1 / -1;
    grid-template-columns: 1fr;
    gap: 26px;
    margin-top: 4px;
  }

  .ft-heading { font-size: 0.62rem; margin: 0 0 13px; }
  .ft-links { gap: 10px; }
  .ft-link { font-size: 0.81rem; }

  .ft-contact { margin: 0 0 20px; gap: 10px; }
  .ft-contact-row { font-size: 0.77rem; }
  .ft-contact-ico { width: 26px; height: 26px; }

  .ft-newsletter-caption { font-size: 0.74rem; margin: 0 0 10px; }
  .ft-form-btn { width: 37px; height: 37px; }

  .ft-bottom-inner { padding: 16px 20px; gap: 7px; }
  .ft-credit { font-size: 0.68rem; line-height: 1.7; }
}

/* ═══════════════════════ 11. ACCESSIBILITY ═══════════════════════ */
@media (prefers-reduced-motion: reduce) {
  .ft-social-btn, .ft-link::after, .ft-credit-link::after,
  .ft-form, .ft-form-btn, .ft-subscribed, .ft-spin {
    transition: none !important;
    animation: none !important;
  }
}
`;
