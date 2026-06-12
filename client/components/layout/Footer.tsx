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

/* ── Footer ──────────────────────────────────────────────────── */
export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
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
                Premium fashion for the modern world. Consciously crafted pieces
                that celebrate ethereal design and sustainable luxury — every
                thread tells a story.
              </p>
              <div className="ft-social" aria-label="Follow us">
                {[
                  { href: "#", label: "Instagram", Icon: IconInstagram },
                  { href: "#", label: "Facebook", Icon: IconFacebook },
                  { href: "#", label: "WhatsApp", Icon: IconWhatsapp },
                  { href: "#", label: "TikTok", Icon: IconTiktok },
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
                    zharmoabdi@gmail.com
                  </a>
                </li>
                <li>
                  <a href="tel:+12345678901" className="ft-contact-row">
                    <span className="ft-contact-ico">
                      <IconPhone />
                    </span>
                    +252 63 3484616
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
                ) : (
                  <form
                    onSubmit={handleSubscribe}
                    className="ft-form"
                    noValidate
                  >
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
                    />
                    <button
                      type="submit"
                      className="ft-form-btn"
                      aria-label="Subscribe"
                    >
                      <IconArrow />
                    </button>
                  </form>
                )}
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
                  href="https://github.com/zharmo"
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
   CSS
══════════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Jost:wght@300;400;500;600&display=swap');

.ft-sr {
  position:absolute;width:1px;height:1px;padding:0;margin:-1px;
  overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;
}

/* ── Root ── */
.ft-root {
  font-family: 'Jost', sans-serif;
  background: #0d0c0a;
  color: #e8e3da;
  position: relative;
  -webkit-font-smoothing: antialiased;
  overflow: hidden;
}

/* warm ambient glow */
.ft-root::before {
  content: '';
  position: absolute;
  bottom: -60px; left: -40px;
  width: 520px; height: 520px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(184,150,90,0.055) 0%, transparent 60%);
  pointer-events: none;
}
.ft-root::after {
  content: '';
  position: absolute;
  top: -40px; right: -60px;
  width: 400px; height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(184,150,90,0.03) 0%, transparent 60%);
  pointer-events: none;
}

/* ── Gold bar ── */
.ft-gold-bar {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(184,150,90,0.3) 15%,
    rgba(212,175,90,0.9) 50%,
    rgba(184,150,90,0.3) 85%,
    transparent 100%
  );
}

/* ── Body ── */
.ft-body {
  padding: clamp(52px,7vw,96px) clamp(24px,5.5vw,88px) clamp(44px,6vw,72px);
  position: relative;
  z-index: 1;
}

/* ── Grid ── */
.ft-grid {
  display: grid;
  grid-template-columns: 1.9fr 1fr 1fr 1.6fr;
  gap: clamp(28px,4vw,60px);
  align-items: start;
}

/* ── Brand ── */
.ft-brand-lockup {
  margin-bottom: 18px;
}

.ft-brand-name {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: clamp(1.55rem, 2.2vw, 2.1rem);
  font-weight: 500;
  letter-spacing: 0.2em;
  color: #f5f0e8;
  line-height: 1.05;
  margin: 0;
}

.ft-brand-desc {
  font-size: 0.81rem;
  color: #6e6a60;
  line-height: 1.85;
  max-width: 290px;
  margin: 0 0 26px;
  font-weight: 300;
}

/* ── Social ── */
.ft-social { display: flex; gap: 9px; }
.ft-social-btn {
  width: 36px; height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.07);
  display: flex; align-items: center; justify-content: center;
  color: #6e6a60;
  text-decoration: none;
  transition: border-color .25s, color .25s, background .25s, transform .2s;
}
.ft-social-btn:hover {
  border-color: rgba(184,150,90,0.5);
  color: #b8965a;
  background: rgba(184,150,90,0.07);
  transform: translateY(-2px);
}

/* ── Column heading ── */
.ft-heading {
  font-size: 0.63rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #b8965a;
  margin: 0 0 18px;
}

/* ── Nav links ── */
.ft-links {
  list-style: none;
  padding: 0; margin: 0;
  display: flex; flex-direction: column; gap: 12px;
}
.ft-link {
  font-size: 0.83rem;
  font-weight: 300;
  color: #8a8478;
  text-decoration: none;
  position: relative;
  display: inline-block;
  transition: color .25s;
}
.ft-link::after {
  content: '';
  position: absolute;
  bottom: -1px; left: 0;
  width: 0; height: 1px;
  background: #b8965a;
  transition: width .3s ease;
  border-radius: 99px;
}
.ft-link:hover { color: #f5f0e8; }
.ft-link:hover::after { width: 100%; }

/* ── Contact ── */
.ft-contact {
  list-style: none;
  padding: 0; margin: 0 0 28px;
  display: flex; flex-direction: column; gap: 11px;
}
.ft-contact-row {
  display: flex; align-items: center; gap: 10px;
  font-size: 0.79rem; font-weight: 300;
  color: #8a8478;
  text-decoration: none;
  transition: color .25s;
  word-break: break-all;
}
.ft-contact-row:hover { color: #f5f0e8; }
.ft-contact-ico {
  width: 28px; height: 28px;
  border-radius: 7px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  display: flex; align-items: center; justify-content: center;
  color: #b8965a;
  flex-shrink: 0;
}

/* ── Newsletter ── */
.ft-newsletter-caption {
  font-size: 0.76rem; color: #504d46; font-weight: 300;
  margin: 0 0 12px;
}
.ft-form {
  display: flex; align-items: center;
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 10px;
  overflow: hidden;
  background: rgba(255,255,255,0.025);
  transition: border-color .25s, box-shadow .25s;
}
.ft-form:focus-within {
  border-color: rgba(184,150,90,0.4);
  box-shadow: 0 0 0 3px rgba(184,150,90,0.06);
}
.ft-input {
  flex: 1; background: transparent; border: none; outline: none;
  padding: 11px 13px;
  font-size: 0.79rem;
  font-family: 'Jost', sans-serif;
  color: #e8e3da;
  min-width: 0;
}
.ft-input::placeholder { color: #3e3c36; }
.ft-form-btn {
  width: 38px; height: 38px; flex-shrink: 0;
  background: #b8965a;
  border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: #0d0c0a;
  margin: 2px;
  border-radius: 7px;
  transition: background .2s, transform .15s;
}
.ft-form-btn:hover { background: #d4af6e; transform: scale(1.05); }

.ft-subscribed {
  display: flex; align-items: center; gap: 8px;
  font-size: 0.77rem; color: #7ec4a0;
  padding: 10px 0;
  animation: ft-pop .4s cubic-bezier(.22,1,.36,1) both;
}
@keyframes ft-pop {
  from { opacity:0; transform:translateY(5px); }
  to   { opacity:1; transform:translateY(0); }
}

/* ── Bottom bar ── */
.ft-bottom {
  border-top: 1px solid rgba(255,255,255,0.05);
  background: #0d0c0a;
  position: relative;
  z-index: 1;
}
.ft-bottom-inner {
  display: flex; align-items: center;
  justify-content: space-between;
  flex-wrap: wrap; gap: 10px;
  padding: 18px clamp(24px,5.5vw,88px);
}
.ft-copy {
  font-size: 0.7rem; color: #8a8478;
  margin: 0; font-weight: 300; letter-spacing: 0.04em;
}
.ft-copy:hover {color: #f5f0e8;}

.ft-bottom-right {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
}
.ft-credit {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 5px;
  font-size: 0.7rem;
  color: #8a8478;
  font-weight: 300;
  letter-spacing: 0.04em;
  line-height: 1.7;
}
.ft-credit-link {
  color: #b8965a;
  text-decoration: none;
  font-weight: 500;
  letter-spacing: 0.055em;
  position: relative;
  transition: color .22s ease, text-shadow .22s ease;
}
.ft-credit-link::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -2px;
  height: 1px;
  background: currentColor;
  opacity: 0.35;
  transform: scaleX(0);
  transform-origin: right;
  transition: transform .24s ease, opacity .24s ease;
}
.ft-credit-link:hover {
  color: #f5f0e8;
  text-shadow: 0 0 16px rgba(184,150,90,0.22);
}
.ft-credit-link:hover::after {
  opacity: 0.75;
  transform: scaleX(1);
  transform-origin: left;
}
.ft-credit-separator {
  color: #514b40;
  margin: 0 2px;
}
.ft-blink {
  font-size: 0.7rem; color: #8a8478; text-decoration: none;
  font-weight: 300; letter-spacing: 0.04em;
  transition: color .2s;
}
.ft-blink:hover { color: #f5f0e8; }
.ft-pipe {
  display: inline-block; width: 1px; height: 10px;
  background: rgba(255,255,255,0.08); vertical-align: middle;
}
.ft-loc {
  font-size: 0.7rem; color: #2e2c28;
  letter-spacing: 0.12em; font-weight: 300; text-transform: uppercase;
}

/* ══ Responsive ══ */
@media (max-width: 1024px) {
  .ft-grid {
    grid-template-columns: 1.4fr 1fr 1fr;
    row-gap: 40px;
  }
  .ft-grid > .ft-col:last-child {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
    align-items: start;
  }
}

@media (max-width: 768px) {
  .ft-grid {
    grid-template-columns: 1fr 1fr;
    gap: 36px 28px;
  }
  .ft-col-brand { grid-column: 1 / -1; }
  .ft-brand-desc { max-width: 100%; }
  .ft-grid > .ft-col:last-child {
    grid-column: 1 / -1;
    grid-template-columns: 1fr 1fr;
  }
  .ft-bottom-inner { flex-direction: column; align-items: flex-start; gap: 8px; }
  .ft-credit { justify-content: flex-start; }
}

@media (max-width: 520px) {
  .ft-grid {
    grid-template-columns: 1fr;
    gap: 34px;
  }
  .ft-col-brand { grid-column: 1; }
  .ft-grid > .ft-col:last-child {
    grid-column: 1;
    grid-template-columns: 1fr;
    gap: 28px;
  }
  .ft-brand-name { font-size: 1.6rem; }
  .ft-bottom-right { flex-direction: column; align-items: flex-start; gap: 6px; }
  .ft-credit {
    gap: 4px;
    font-size: 0.68rem;
    line-height: 1.9;
  }
  .ft-pipe { display: none; }
}
`;
