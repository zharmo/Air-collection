'use client';

import Link from 'next/link';
import { FaLeaf, FaRecycle, FaHandsHelping, FaFeatherAlt } from 'react-icons/fa';

const aboutStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500;600&display=swap');

  :root {
    --ink: #0a0a0a;
    --ink-soft: #6b6b6b;
    --ink-faint: #ababab;
    --surface: #ffffff;
    --surface-warm: #fafaf7;
    --surface-muted: #f4f2ef;
    --accent: #c8a96e;
    --accent-light: #f0e8d8;
    --border: rgba(0,0,0,0.08);
    --border-strong: rgba(0,0,0,0.15);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .about-hero {
    min-height: auto;
    background: linear-gradient(135deg, #f5f0eb 0%, #e8dfd0 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    padding: 72px 24px 76px;
    border-bottom: 1px solid var(--border);
  }

  .about-hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 70% 70% at 50% 60%, rgba(200,169,110,0.18) 0%, transparent 70%);
    pointer-events: none;
  }

  .about-hero-inner {
    text-align: center;
    position: relative;
    z-index: 1;
    max-width: 780px;
  }

  .about-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
  }

  .about-eyebrow-line {
    width: 28px;
    height: 1px;
    background: var(--accent);
  }

  .about-eyebrow-label {
    font-family: 'Jost', sans-serif;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--ink-faint);
  }

  .about-hero-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(42px, 5vw, 72px);
    font-weight: 500;
    line-height: 0.95;
    letter-spacing: -0.01em;
    color: var(--ink);
    margin-bottom: 16px;
  }

  .about-hero-sub {
    font-family: 'Jost', sans-serif;
    font-size: 15px;
    font-weight: 300;
    color: var(--ink-soft);
    line-height: 1.7;
    margin-bottom: 32px;
  }

  .btn-primary-ink {
    font-family: 'Jost', sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    background: var(--ink);
    color: #fff;
    border: 1.5px solid var(--ink);
    padding: 18px 48px;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 12px;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    cursor: pointer;
  }

  .btn-primary-ink:hover {
    background: transparent;
    color: var(--ink);
  }

  .btn-outline-light-ink {
    font-family: 'Jost', sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    background: transparent;
    color: #fff;
    border: 1.5px solid rgba(255,255,255,0.5);
    padding: 18px 48px;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 12px;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    cursor: pointer;
  }

  .btn-outline-light-ink:hover {
    background: #fff;
    color: var(--ink);
    border-color: #fff;
  }

  .about-section {
    padding: 100px max(24px, calc((100vw - 1300px) / 2 + 40px));
  }

  .section-label {
    font-family: 'Jost', sans-serif;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .section-label::before {
    content: '';
    display: inline-block;
    width: 28px;
    height: 1px;
    background: var(--accent);
  }

  .section-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(36px, 5vw, 56px);
    font-weight: 500;
    color: var(--ink);
    line-height: 1.05;
    letter-spacing: -0.01em;
    margin-bottom: 28px;
  }

  .section-body {
    font-family: 'Jost', sans-serif;
    font-size: 15px;
    font-weight: 300;
    color: var(--ink-soft);
    line-height: 1.85;
    margin-bottom: 18px;
  }

  .story-section {
    background: var(--surface);
    padding: 100px max(24px, calc((100vw - 1300px) / 2 + 40px));
  }

  .story-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 80px;
    align-items: center;
  }

  .story-image-wrap {
    background: var(--surface-muted);
    aspect-ratio: 4/5;
    overflow: hidden;
    position: relative;
  }

  .story-image-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .story-image-wrap:hover img {
    transform: scale(1.04);
  }

  .story-image-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 80px;
    background: linear-gradient(135deg, #f0e8d8 0%, #e8dfd0 100%);
  }

  .values-section {
    background: var(--surface-muted);
    padding: 100px max(24px, calc((100vw - 1300px) / 2 + 40px));
  }

  .values-header {
    text-align: center;
    margin-bottom: 72px;
    border-bottom: 1px solid var(--border);
    padding-bottom: 40px;
  }

  .values-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0;
    border: 1px solid var(--border-strong);
  }

  .value-card {
    padding: 48px 32px 40px;
    text-align: center;
    border-right: 1px solid var(--border-strong);
    background: var(--surface);
    position: relative;
    overflow: hidden;
    transition: background 0.3s ease;
  }

  .value-card:last-child {
    border-right: none;
  }

  .value-card::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--accent);
    transform: scaleX(0);
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .value-card:hover::after {
    transform: scaleX(1);
  }

  .value-card:hover {
    background: var(--surface-warm);
  }

  .value-icon-wrap {
    width: 56px;
    height: 56px;
    border: 1px solid var(--border-strong);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24px;
    color: var(--accent);
    font-size: 22px;
    transition: background 0.3s, color 0.3s;
  }

  .value-card:hover .value-icon-wrap {
    background: var(--ink);
    color: #fff;
    border-color: var(--ink);
  }

  .value-title {
    font-family: 'Jost', sans-serif;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--ink);
    margin-bottom: 14px;
  }

  .value-desc {
    font-family: 'Jost', sans-serif;
    font-size: 13px;
    font-weight: 300;
    color: var(--ink-soft);
    line-height: 1.7;
  }

  .quote-section {
    background: var(--surface-warm);
    padding: 120px max(24px, calc((100vw - 1300px) / 2 + 40px));
    text-align: center;
    position: relative;
    overflow: hidden;
  }

  .quote-section::before {
    content: '\u201C';
    position: absolute;
    top: -40px;
    left: 50%;
    transform: translateX(-50%);
    font-family: 'Cormorant Garamond', serif;
    font-size: 320px;
    color: rgba(200,169,110,0.08);
    line-height: 1;
    pointer-events: none;
    user-select: none;
  }

  .quote-inner {
    max-width: 860px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
  }

  .quote-text {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(22px, 3.5vw, 34px);
    font-weight: 400;
    font-style: italic;
    line-height: 1.55;
    color: var(--ink);
    margin-bottom: 36px;
  }

  .quote-divider {
    width: 40px;
    height: 1px;
    background: var(--accent);
    margin: 0 auto 20px;
  }

  .quote-author {
    font-family: 'Jost', sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--ink-soft);
  }

  .stats-section {
    background: var(--surface);
    padding: 100px max(24px, calc((100vw - 1300px) / 2 + 40px));
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0;
    border-top: 1px solid var(--border-strong);
    border-left: 1px solid var(--border-strong);
  }

  .stat-cell {
    padding: 56px 32px;
    text-align: center;
    border-right: 1px solid var(--border-strong);
    border-bottom: 1px solid var(--border-strong);
    position: relative;
  }

  .stat-number {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(52px, 7vw, 80px);
    font-weight: 500;
    color: var(--ink);
    line-height: 1;
    margin-bottom: 12px;
    letter-spacing: -0.02em;
  }

  .stat-label {
    font-family: 'Jost', sans-serif;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--ink-soft);
  }

  .stat-accent {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 2px;
    height: 24px;
    background: var(--accent);
  }

  .cta-section {
    background: var(--ink);
    padding: 100px max(24px, calc((100vw - 1300px) / 2 + 40px));
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 80px;
    align-items: center;
  }

  .cta-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(40px, 5vw, 64px);
    font-weight: 500;
    color: #fff;
    line-height: 1.05;
    letter-spacing: -0.01em;
  }

  .cta-title span {
    color: var(--accent);
  }

  .cta-right {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .cta-desc {
    font-family: 'Jost', sans-serif;
    font-size: 15px;
    font-weight: 300;
    color: rgba(255,255,255,0.5);
    line-height: 1.75;
    margin-bottom: 12px;
  }

  @media (max-width: 1024px) {
    .story-grid { grid-template-columns: 1fr; gap: 48px; }
    .story-image-wrap { aspect-ratio: 16/9; }
    .values-grid { grid-template-columns: 1fr 1fr; }
    .value-card:nth-child(2) { border-right: none; }
    .value-card:nth-child(3) { border-top: 1px solid var(--border-strong); border-right: 1px solid var(--border-strong); }
    .value-card:nth-child(4) { border-top: 1px solid var(--border-strong); border-right: none; }
    .stats-grid { grid-template-columns: 1fr 1fr; }
    .cta-section { grid-template-columns: 1fr; gap: 40px; }
  }

  @media (max-width: 768px) {
    .about-section, .story-section, .values-section,
    .quote-section, .stats-section { padding: 64px 24px; }
    .cta-section { padding: 64px 24px; }
    .about-hero { padding: 48px 24px 56px; }
    .values-grid { grid-template-columns: 1fr; }
    .value-card { border-right: none !important; border-top: 1px solid var(--border-strong); }
    .value-card:first-child { border-top: none; }
    .stats-grid { grid-template-columns: 1fr 1fr; }
  }

  @media (max-width: 480px) {
    .stats-grid { grid-template-columns: 1fr 1fr; }
    .stat-cell { padding: 36px 16px; }
  }
`;

export default function AboutPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: aboutStyles }} />

      {/* ── HERO ── */}
      <div className="about-hero">
        <div className="about-hero-inner">
          <div className="about-eyebrow">
            <span className="about-eyebrow-line" />
            <span className="about-eyebrow-label">Est. 2024 · Slow Fashion</span>
            <span className="about-eyebrow-line" />
          </div>
          <h1 className="about-hero-title">About Air Collection</h1>
          <p className="about-hero-sub">Where Comfort Meets Conscience</p>
          <Link href="/products" className="btn-primary-ink">
            Explore Collection
          </Link>
        </div>
      </div>

      {/* ── STORY ── */}
      <div className="story-section">
        <div className="story-grid">
          <div>
            <div className="section-label">Our Story</div>
            <h2 className="section-title">Born from a<br />Simple Idea</h2>
            <p className="section-body">
              Founded in 2024, Air Collection was born from a simple idea: clothing should feel like a second skin — weightless, breathable, and effortless.
            </p>
            <p className="section-body">
              We started with a small atelier in the city, sourcing organic European flax and working with artisans who share our passion for slow fashion. Today, we create pieces that transcend seasons, designed to age with grace and reduce waste.
            </p>
            <p className="section-body">
              Every garment is a testament to mindful production, ethical labor, and uncompromised comfort.
            </p>
          </div>
          <div className="story-image-wrap">
            <img
              src="/images/about/story-image.jpg"
              alt="Our atelier"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                const placeholder = document.createElement('div');
                placeholder.className = 'story-image-placeholder';
                placeholder.textContent = '🪡';
                (e.target as HTMLImageElement).parentElement!.appendChild(placeholder);
              }}
            />
          </div>
        </div>
      </div>

      {/* ── VALUES ── */}
      <div className="values-section">
        <div className="values-header">
          <div className="section-label" style={{ justifyContent: 'center' }}>Our Values</div>
          <h2 className="section-title" style={{ marginBottom: 0 }}>What We Stand For</h2>
        </div>
        <div className="values-grid">
          <div className="value-card">
            <div className="value-icon-wrap">
              <FaLeaf />
            </div>
            <div className="value-title">Sustainable</div>
            <p className="value-desc">100% organic, biodegradable materials from ethical sources.</p>
          </div>
          <div className="value-card">
            <div className="value-icon-wrap">
              <FaFeatherAlt />
            </div>
            <div className="value-title">Light as Air</div>
            <p className="value-desc">Weightless fabrics that move with you, never against you.</p>
          </div>
          <div className="value-card">
            <div className="value-icon-wrap">
              <FaRecycle />
            </div>
            <div className="value-title">Circular Design</div>
            <p className="value-desc">Garments made to last, repair, and eventually return to nature.</p>
          </div>
          <div className="value-card">
            <div className="value-icon-wrap">
              <FaHandsHelping />
            </div>
            <div className="value-title">Fair Craftsmanship</div>
            <p className="value-desc">Living wages and safe working conditions for all partners.</p>
          </div>
        </div>
      </div>

      {/* ── QUOTE ── */}
      <div className="quote-section">
        <div className="quote-inner">
          <p className="quote-text">
            "We believe that luxury is not about price, but about feeling — the feel of the fabric, the freedom of movement, the quiet confidence of wearing less but better."
          </p>
          <div className="quote-divider" />
          <p className="quote-author">Elena Marchetti — Creative Director</p>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-cell">
            <div className="stat-accent" />
            <div className="stat-number">100%</div>
            <div className="stat-label">Organic Materials</div>
          </div>
          <div className="stat-cell">
            <div className="stat-accent" />
            <div className="stat-number">−45%</div>
            <div className="stat-label">Water Usage vs Industry</div>
          </div>
          <div className="stat-cell">
            <div className="stat-accent" />
            <div className="stat-number">0</div>
            <div className="stat-label">Single‑use Plastic</div>
          </div>
          <div className="stat-cell">
            <div className="stat-accent" />
            <div className="stat-number">1%</div>
            <div className="stat-label">Donated to Environment</div>
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="cta-section">
        <div>
          <h2 className="cta-title">
            Be Part of<br />the <span>Change.</span>
          </h2>
        </div>
        <div className="cta-right">
          <p className="cta-desc">
            Join a community that values quality, ethics, and the planet. Get exclusive access to new drops, behind-the-scenes stories, and members-only offers.
          </p>
          <div>
            <Link href="/auth/signup" className="btn-outline-light-ink">
              Sign Up for Updates
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
