"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FaCopy, FaCheck, FaArrowRight, FaTicketAlt, FaTags } from "react-icons/fa";

interface PromoCode {
  id: number;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number | string;
  min_order_amount: number | string;
  expires_at: string | null;
  featured: boolean;
  is_active: boolean;
  allowed_categories: number[];
  excluded_categories: number[];
}

interface Category {
  id: number;
  name: string;
}

export default function PromoBanner() {
  const [promo, setPromo] = useState<PromoCode | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    fetchFeaturedPromo();
  }, []);

  const fetchFeaturedPromo = async () => {
    try {
      // Fetch featured promo
      const promoRes = await fetch(`${API_URL}/promocodes/featured`);
      const promoData = await promoRes.json();

      if (promoData.success && promoData.data) {
        setPromo(promoData.data);

        // Fetch categories to get names for display
        const catsRes = await fetch(`${API_URL}/categories`);
        const catsData = await catsRes.json();
        if (catsData.success && catsData.data) {
          setCategories(catsData.data);
        }
      } else {
        setPromo(null);
      }
    } catch (error) {
      console.error("Error fetching featured promo:", error);
      setPromo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!promo) return;
    try {
      await navigator.clipboard.writeText(promo.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  // ── Get category names from IDs ──
  const getCategoryNames = (ids: number[]): string => {
    if (!ids || ids.length === 0) return "";
    const names = ids
      .map((id) => {
        const cat = categories.find((c) => c.id === id);
        return cat ? cat.name : null;
      })
      .filter(Boolean);
    return names.join(", ");
  };

  // ── Get category restriction display text ──
  const getCategoryDisplay = (): { text: string; icon?: React.ReactNode } => {
    if (!promo) return { text: "" };

    const allowed = promo.allowed_categories || [];
    const excluded = promo.excluded_categories || [];

    if (allowed.length > 0) {
      const names = getCategoryNames(allowed);
      return {
        text: `Valid for: ${names || "Selected categories"}`,
        icon: <FaTags size={10} />,
      };
    }

    if (excluded.length > 0) {
      const names = getCategoryNames(excluded);
      return {
        text: `Excludes: ${names || "Selected categories"}`,
        icon: <FaTags size={10} />,
      };
    }

    return { text: "All categories", icon: <FaTags size={10} /> };
  };

  // Show nothing while loading or no promo
  if (loading) return null;
  if (!promo) return null;

  // ── Parse numeric values safely ──
  const discountValue = parseFloat(String(promo.discount_value)) || 0;
  const minOrder = parseFloat(String(promo.min_order_amount)) || 0;

  // Format discount display
  const discountDisplay =
    promo.discount_type === "percentage"
      ? `${discountValue}% off`
      : `$${discountValue.toFixed(2)} off`;

  // Format expiry date
  const formatExpiry = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const expiry = formatExpiry(promo.expires_at);

  // Format minimum order
  const minOrderDisplay =
    minOrder > 0 ? `$${minOrder.toFixed(2)} minimum order` : null;

  // Get category restriction display
  const categoryDisplay = getCategoryDisplay();

  return (
    <section className="pb-banner" aria-label="Featured promotion">
      <style>{CSS}</style>

      <div className="pb-goldline" aria-hidden="true" />

      <div className="pb-inner">
        {/* ── Left: offer copy ── */}
        <div className="pb-content">
          <span className="pb-eyebrow">
            <FaTicketAlt size={10} aria-hidden="true" />
            Featured offer
          </span>
          <p className="pb-headline">{discountDisplay}</p>
          <p className="pb-sub">
            on your next order
            {minOrderDisplay ? <span className="pb-sub-detail"> · {minOrderDisplay}</span> : null}
          </p>
          {expiry && <p className="pb-expiry">Valid through {expiry}</p>}
          {categoryDisplay.text && (
            <p className="pb-category">
              <span className="pb-category-icon">{categoryDisplay.icon}</span>
              {categoryDisplay.text}
            </p>
          )}
        </div>

        {/* ── Right: ticket stub ── */}
        <div className="pb-stub">
          <div className="pb-stub-code-zone">
            <span className="pb-stub-label">Code</span>
            <span className="pb-stub-code">{promo.code}</span>
          </div>

          <span className="pb-notch pb-notch-top" aria-hidden="true" />
          <span className="pb-notch pb-notch-bottom" aria-hidden="true" />

          <div className="pb-stub-action-zone">
            <button
              type="button"
              className={`pb-copy-btn ${copied ? "is-copied" : ""}`}
              onClick={handleCopyCode}
              aria-label={copied ? "Code copied" : "Copy code"}
            >
              {copied ? <FaCheck size={12} /> : <FaCopy size={12} />}
              {copied ? "Copied" : "Copy code"}
            </button>
            <Link href="/products" className="pb-shop-btn">
              Shop now
              <FaArrowRight size={11} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════
   CSS
══════════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Jost:wght@300;400;500;600&display=swap');

.pb-banner {
  position: relative;
  width: 100%;
  background: #0d0c0a;
  font-family: 'Jost', sans-serif;
  overflow: hidden;
}

.pb-goldline {
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

.pb-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: clamp(32px,4.5vw,52px) clamp(24px,5.5vw,88px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(28px,4vw,56px);
  flex-wrap: wrap;
}

/* ── Left: content ── */
.pb-content {
  flex: 1;
  min-width: 240px;
}

.pb-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #b8965a;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin: 0 0 14px;
}

.pb-headline {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: clamp(2.2rem, 4.2vw, 3.4rem);
  font-weight: 600;
  color: #f5f0e8;
  line-height: 1;
  letter-spacing: 0.01em;
  margin: 0 0 8px;
}

.pb-sub {
  font-size: 0.86rem;
  font-weight: 300;
  color: #a29c8f;
  margin: 0 0 6px;
}

.pb-sub-detail {
  color: #6e6a60;
}

.pb-expiry {
  font-size: 0.75rem;
  font-weight: 300;
  color: #6e6a60;
  letter-spacing: 0.03em;
  margin: 0 0 8px;
}

/* ── Category restriction ── */
.pb-category {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 400;
  color: #a29c8f;
  background: rgba(184,150,90,0.08);
  border: 1px solid rgba(184,150,90,0.12);
  padding: 3px 12px;
  border-radius: 20px;
  margin: 0;
  letter-spacing: 0.02em;
}

.pb-category-icon {
  color: #b8965a;
  display: inline-flex;
  align-items: center;
}

/* ── Right: ticket stub ── */
.pb-stub {
  position: relative;
  display: flex;
  background: #161310;
  border: 1px solid rgba(184,150,90,0.25);
  border-radius: 14px;
  overflow: hidden;
  flex-shrink: 0;
}

.pb-stub-code-zone {
  flex: 0 0 168px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 7px;
  padding: 22px 20px;
}

.pb-stub-label {
  font-size: 0.63rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #6e6a60;
}

.pb-stub-code {
  font-family: 'Jost', sans-serif;
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: 0.09em;
  color: #f5f0e8;
  word-break: break-all;
}

.pb-stub-action-zone {
  flex: 1;
  min-width: 168px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  padding: 22px 22px 22px 30px;
  border-left: 1px dashed rgba(184,150,90,0.32);
}

.pb-notch {
  position: absolute;
  left: 168px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #0d0c0a;
  transform: translate(-50%, -50%);
}

.pb-notch-top { top: 0; }
.pb-notch-bottom { top: 100%; }

.pb-copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: 1px solid rgba(184,150,90,0.4);
  color: #b8965a;
  padding: 9px 16px;
  border-radius: 7px;
  font-family: 'Jost', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: background .2s, border-color .2s, color .2s;
}

.pb-copy-btn:hover {
  background: rgba(184,150,90,0.1);
  border-color: rgba(184,150,90,0.6);
}

.pb-copy-btn.is-copied {
  border-color: rgba(126,196,160,0.5);
  color: #7ec4a0;
}

.pb-shop-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #b8965a;
  color: #0d0c0a;
  padding: 9px 18px;
  border-radius: 7px;
  font-family: 'Jost', sans-serif;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-decoration: none;
  transition: background .2s, transform .15s;
}

.pb-shop-btn:hover {
  background: #d4af6e;
  transform: translateY(-1px);
}

@media (prefers-reduced-motion: reduce) {
  .pb-copy-btn, .pb-shop-btn { transition: none; }
}

/* ══ Responsive ══ */
@media (max-width: 640px) {
  .pb-inner {
    flex-direction: column;
    align-items: stretch;
  }

  .pb-stub {
    flex-direction: column;
  }

  .pb-stub-code-zone {
    flex: 0 0 auto;
    padding: 18px 20px 14px;
  }

  .pb-stub-action-zone {
    padding: 14px 20px 20px;
    border-left: none;
    border-top: 1px dashed rgba(184,150,90,0.32);
  }

  .pb-notch {
    left: 0;
    top: 86px;
  }

  .pb-notch-top { left: 0; transform: translate(-50%, -50%); }
  .pb-notch-bottom { left: 100%; top: 86px; transform: translate(-50%, -50%); }

  .pb-shop-btn, .pb-copy-btn {
    justify-content: center;
  }

  .pb-category {
    font-size: 0.65rem;
    padding: 2px 10px;
  }
}
`;

/**
 * ── Key Changes ──
 *
 * 1. Added `allowed_categories` and `excluded_categories` to PromoCode interface.
 * 2. Added `categories` state to store category names.
 * 3. Fetches categories when the featured promo is loaded.
 * 4. `getCategoryDisplay()` function determines what to show:
 *    - If `allowed_categories` has values → "Valid for: Category1, Category2"
 *    - If `excluded_categories` has values → "Excludes: Category1, Category2"
 *    - If both are empty → "All categories"
 * 5. Displays the category restriction as a small tag/badge below the expiry date.
 */