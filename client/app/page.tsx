"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FaStar,
  FaRegStar,
  FaStarHalfAlt,
  FaArrowRight,
  FaQuoteLeft,
} from "react-icons/fa";
import axiosInstance from "@/utils/axiosConfig";
import { useCart } from "@/context/CartContext";
import PromoBanner from "@/components/PromoBanner";

interface Product {
  id: number;
  name: string;
  price: number;
  compare_price?: number;
  images: { image_url: string; is_primary: boolean }[];
  stock_quantity: number;
}

interface Category {
  id?: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  desc?: string;
}

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const { addToCart } = useCart();

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [aiRecommended, setAiRecommended] = useState<Product[]>([]);
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Fallback categories, shown only if the database has none at all.
  const categories: Category[] = [
    {
      name: "Baggy Pants",
      slug: "baggy-pants",
      icon: "👖",
      desc: "Relaxed & Oversized",
    },
    { name: "Footwear", slug: "footwear", icon: "👟", desc: "Step in Style" },
    { name: "T-Shirts", slug: "tshirt", icon: "👕", desc: "Essential Basics" },
    {
      name: "Drop Shoulder",
      slug: "drop-shoulder",
      icon: "👚",
      desc: "Effortless Drape",
    },
  ];

  // The four categories the homepage should always show, in this order —
  // everything else in the catalog is reached via "View All" instead.
  const homepageSlugs = ["baggy-pants", "tshirt", "footwear", "drop-shoulder"];

  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
    "http://localhost:5000";

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          axiosInstance.get("/products"),
          axiosInstance.get("/categories"),
        ]);
        const allProducts = productsRes.data.data;
        const allCategories = categoriesRes.data.data;
        setFeaturedProducts(allProducts.slice(0, 6));
        setBestSellers(allProducts.slice(0, 6));
        setNewArrivals(allProducts.slice(0, 6));
        setAiRecommended(allProducts.slice(8, 12));
        setDbCategories(allCategories);
      } catch (error) {
        console.error("Failed to fetch home data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  const handleAddToCart = (product: Product) => {
    const imageUrl = getPrimaryImage(product);
    addToCart(product.id, 1, {
      name: product.name,
      price: Number(product.price),
      image: imageUrl,
    });
  };

  const getPrimaryImage = (product: Product) => {
    const primary = product.images?.find((img) => img.is_primary);
    const imagePath = primary?.image_url || product.images?.[0]?.image_url;
    if (!imagePath) return "/images/placeholders/placeholder.jpg";
    if (imagePath.startsWith("/uploads")) return `${backendUrl}${imagePath}`;
    return imagePath;
  };

  const getCategoryImage = (category: Category) => {
    if (!category.image) return "";
    if (category.image.startsWith("/uploads"))
      return `${backendUrl}${category.image}`;
    return category.image;
  };

  const getCategoryIcon = (category: Category) => {
    if (category.icon) return category.icon;
    const key = `${category.slug} ${category.name}`.toLowerCase();
    if (key.includes("pant")) return "👖";
    if (key.includes("shoe") || key.includes("footwear")) return "👟";
    if (key.includes("shirt") || key.includes("tee")) return "👕";
    if (key.includes("winter")) return "🧥";
    return "✦";
  };

  // Pin the four categories the homepage should feature, by slug, in the
  // exact order given — rather than whatever four the database happens to
  // return first. Falls back gracefully if the database has no categories
  // at all, or if none of the target slugs exist yet.
  const displayCategories: Category[] = (() => {
    if (dbCategories.length) {
      const matched = homepageSlugs
        .map((slug) => dbCategories.find((c) => c.slug === slug))
        .filter((c): c is Category => Boolean(c));
      if (matched.length) return matched;
      return dbCategories.slice(0, 4);
    }
    return categories;
  })();

  const renderStars = (rating: number = 5) => {
    const full = Math.floor(rating);
    const half = rating % 1 !== 0;
    const empty = 5 - full - (half ? 1 : 0);
    return (
      <span style={{ display: "inline-flex", gap: 3 }}>
        {[...Array(full)].map((_, i) => (
          <FaStar key={i} style={{ color: "#c8a96e" }} />
        ))}
        {half && <FaStarHalfAlt style={{ color: "#c8a96e" }} />}
        {[...Array(empty)].map((_, i) => (
          <FaRegStar key={i} style={{ color: "#c8a96e" }} />
        ))}
      </span>
    );
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "2px solid #e5e5e5",
              borderTopColor: "#0a0a0a",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <p
            style={{
              fontFamily: "Jost, sans-serif",
              fontSize: 12,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#999",
            }}
          >
            Loading
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
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
          --product-bg: #f7f6f3;
          --radius: 0px;
          --card-shadow: 0 2px 20px rgba(0,0,0,0.06);
          --card-shadow-hover: 0 12px 48px rgba(0,0,0,0.12);
          --home-x: 36px;
          --home-pad-x: max(var(--home-x), calc((100vw - 1400px) / 2 + var(--home-x)));
        }

        * { box-sizing: border-box; }

        body { background: var(--surface); }

        .h-display {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 500;
          letter-spacing: -0.01em;
          line-height: 1;
          color: var(--ink);
        }

        .h-section {
          font-family: 'Cormorant Garamond', serif;
          font-size: 36px;
          font-weight: 500;
          color: var(--ink);
          margin: 0;
        }

        .label-caps {
          font-family: 'Jost', sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--ink-soft);
        }

        .body-text {
          font-family: 'Jost', sans-serif;
          font-weight: 300;
          color: var(--ink-soft);
          line-height: 1.7;
        }

        /* ── Hero ── */
        .hero {
          min-height: calc(100vh - 72px);
          min-height: calc(100svh - 72px);
          background: var(--surface-warm);
          position: relative;
          overflow: hidden;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
        }

        .hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 80% 80% at 70% 50%, #f0e8d8 0%, transparent 70%);
          pointer-events: none;
        }

        .hero-content {
          padding: 80px var(--home-pad-x);
          position: relative;
          z-index: 1;
        }

        .hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 28px;
        }

        .hero-eyebrow-line {
          width: 40px;
          height: 1px;
          background: var(--accent);
        }

        .hero-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(64px, 8vw, 110px);
          font-weight: 500;
          line-height: 0.95;
          letter-spacing: -0.02em;
          color: var(--ink);
          margin-bottom: 28px;
        }

        .hero-sub {
          font-family: 'Jost', sans-serif;
          font-size: 16px;
          font-weight: 300;
          color: var(--ink-soft);
          letter-spacing: 0.03em;
          margin-bottom: 48px;
          max-width: 380px;
          line-height: 1.7;
        }

        .hero-actions {
          display: flex;
          align-items: center;
          gap: 32px;
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
          padding: 14px 22px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }

        .btn-primary-ink:hover {
          background: transparent;
          color: var(--ink);
        }

        .btn-ghost-ink {
          font-family: 'Jost', sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--ink-soft);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding-bottom: 2px;
          border-bottom: 1px solid var(--border-strong);
          transition: color 0.2s, border-color 0.2s;
        }

        .btn-ghost-ink:hover {
          color: var(--ink);
          border-color: var(--ink);
        }

        .hero-visual {
          height: 100%;
          min-height: calc(100vh - 72px);
          min-height: calc(100svh - 72px);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 80px 40px;
        }

        .hero-orb {
          width: min(480px, 80%);
          aspect-ratio: 1;
          border-radius: 50%;
          background: linear-gradient(135deg, #fff 0%, #e8dfd0 100%);
          box-shadow: 0 40px 100px rgba(200, 169, 110, 0.25), 0 0 0 1px rgba(200,169,110,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 120px;
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-16px); }
        }

        .hero-stat-bar {
          position: absolute;
          bottom: 60px;
          left: 0;
          right: 0;
          display: flex;
          gap: 0;
        }

        .hero-stat {
          flex: 1;
          padding: 24px 0;
          border-top: 1px solid var(--border-strong);
          text-align: center;
        }

        /* ── Section Layout ── */
        .section {
          padding: 100px var(--home-pad-x);
        }

        .section-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 56px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 28px;
        }

        /* ── Product Cards ── */
        .product-grid-4 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }

        .product-card {
          background: var(--surface);
          cursor: pointer;
          position: relative;
          transition: box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .product-card:hover {
          box-shadow: var(--card-shadow-hover);
        }

        .product-card-image {
          background: var(--product-bg);
          aspect-ratio: 6/7;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
        }

        .product-card-image > a {
          display: block;
          width: 100%;
          height: 100%;
        }

        .product-card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          padding: 0;
          transition: transform .55s cubic-bezier(.16,1,.3,1);
        }

        .product-card:hover .product-card-image img {
          transform: scale(1.06);
        }

        .product-card-badge {
          position: absolute;
          font-family: 'Jost', sans-serif;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          padding: 3px 6px;
          background: var(--ink);
          color: #fff;
          z-index: 2;
        }

        .product-card-badge.new { background: var(--ink); }
        .product-card-badge.ai { background: var(--accent); color: var(--ink); }

        .product-card-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 12px 10px;
          background: var(--ink);
          transform: translateY(100%);
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 3;
        }

        .product-card:hover .product-card-overlay {
          transform: translateY(0);
        }

        .product-card-overlay button {
          width: 100%;
          background: none;
          border: none;
          font-family: 'Jost', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #fff;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: opacity 0.2s;
        }

        .product-card-overlay button:hover { opacity: 0.7; }
        .product-card-overlay button:disabled { opacity: .35; cursor: not-allowed; }

        .product-card-body {
          padding: 20px 6px 8px;
        }

        .product-card-name {
          font-family: 'Jost', sans-serif;
          font-size: 14px;
          font-weight: 400;
          color: var(--ink);
          text-decoration: none;
          letter-spacing: 0.02em;
          display: block;
          margin-bottom: 8px;
          transition: opacity 0.2s;
        }

        .product-card-name:hover { opacity: 0.6; }

        .product-card-price {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px;
          font-weight: 500;
          color: var(--ink);
        }

        .product-card-compare {
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          color: var(--ink-faint);
          text-decoration: line-through;
          margin-left: 8px;
        }

        /* ── Categories ── */
        .category-section {
          background: var(--surface-muted);
          padding: 100px var(--home-pad-x);
        }

        .category-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .category-card {
          position: relative;
          display: block;
          aspect-ratio: 3/4;
          overflow: hidden;
          text-decoration: none;
          background: var(--product-bg);
          border: 1px solid var(--border);
        }

        .category-card-media {
          position: absolute;
          inset: 0;
        }

        .category-card-media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .category-card:hover .category-card-media img {
          transform: scale(1.07);
        }

        .category-card-fallback {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 56px;
          background: linear-gradient(160deg, #f4f2ef 0%, #ebe5da 100%);
        }

        .category-card-scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(10,10,10,0.85) 0%,
            rgba(10,10,10,0.35) 42%,
            rgba(10,10,10,0) 65%
          );
        }

        .category-card-content {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          padding: 22px 22px 24px;
          z-index: 2;
        }

        .category-card-line {
          width: 30px;
          height: 1px;
          background: var(--accent);
          margin-bottom: 12px;
          transform: scaleX(0.55);
          transform-origin: left;
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .category-card:hover .category-card-line {
          transform: scaleX(1);
        }

        .category-name {
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #ffffff;
          display: block;
          margin-bottom: 6px;
        }

        .category-desc {
          font-family: 'Jost', sans-serif;
          font-size: 12px;
          font-weight: 300;
          color: rgba(255,255,255,0.72);
          display: block;
        }

        /* ── Marquee / Trust Bar ── */
        .trust-bar {
          background: var(--ink);
          padding: 18px 0;
          overflow: hidden;
        }

        .trust-inner {
          display: flex;
          gap: 80px;
          animation: marquee 18s linear infinite;
          white-space: nowrap;
        }

        .trust-item {
          font-family: 'Jost', sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.7);
          flex-shrink: 0;
        }

        .trust-sep {
          color: var(--accent);
          flex-shrink: 0;
        }

        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        /* ── Review Section ── */
        .review-section {
          background: var(--surface-warm);
          padding: 100px var(--home-pad-x);
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
        }

        .review-quote-icon {
          color: var(--accent);
          margin-bottom: 24px;
        }

        .review-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px;
          font-weight: 400;
          font-style: italic;
          line-height: 1.5;
          color: var(--ink);
          margin-bottom: 28px;
        }

        .review-author {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .review-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--surface-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .ap-badge-wrap {
          position: absolute; top: 12px; left: 12px;
          display: flex; flex-direction: column; gap: 5px; z-index: 2;
        }

        .ap-badge {
          font-family: 'Jost', sans-serif;
          font-size: 9px; font-weight: 700;
          letter-spacing: .08em; text-transform: uppercase;
          padding: 3px 6px; display: inline-block; width: fit-content;
        }

        .ap-badge-sale    { background: var(--ink); color: #fff; }
        .ap-badge-new     { background: var(--accent); color: var(--ink); }
        .ap-badge-sold    { background: rgba(255,255,255,.9); color: rgb(220, 53, 69); border: 1px solid rgba(192,57,43,.2); }

        .review-stat-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px;
          background: var(--border-strong);
        }

        .review-stat {
          background: var(--surface-warm);
          padding: 36px 32px;
          text-align: center;
        }

        .review-stat-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 52px;
          font-weight: 500;
          color: var(--ink);
          line-height: 1;
          margin-bottom: 8px;
        }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          :root { --home-x: 24px; }
          .hero { grid-template-columns: 1fr; min-height: 80vh; min-height: 80svh; }
          .hero-visual { display: none; }
          .hero-content { padding-top: 80px; padding-bottom: 80px; }
          .product-grid-4 { grid-template-columns: repeat(2, 1fr); }
          .category-grid { grid-template-columns: repeat(2, 1fr); }
          .review-section { grid-template-columns: 1fr; gap: 48px; }
        }

        @media (max-width: 768px) {
          .hero-title { font-size: clamp(52px, 13vw, 80px); }
          .section { padding-top: 64px; padding-bottom: 64px; }
          .category-section { padding-top: 64px; padding-bottom: 64px; }
          .review-section { padding-top: 64px; padding-bottom: 64px; }
        }

        @media (max-width: 640px) {
          :root { --home-x: 16px; }
          .category-card { aspect-ratio: 1/1; }
        }

        @media (max-width: 480px) {
          .product-grid-4 { grid-template-columns: 1fr 1fr; }
          .category-grid { grid-template-columns: 1fr 1fr; }
        }

        @media (max-width: 360px) {
          :root { --home-x: 10px; }
        }
      `}</style>

      {/* ── PROMO BANNER ── */}
      <PromoBanner />

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-line" />
            <span className="label-caps">New Season 2026</span>
          </div>
          <h1 className="hero-title">
            Light
            <br />
            as Air.
          </h1>
          <p className="hero-sub">
            Dharka qaabkoodu fudud yahay, lagana sameeyay linen iyo marooyin 
            dabiici ah oo hawadu si fiican u dhex marto. 
            Xidho dareenka fudaydka iyo miisaan la'aanta
          </p>
          <div className="hero-actions">
            <Link href="/products?new=true" className="btn-primary-ink">
              Shop New Arrivals <FaArrowRight size={12} />
            </Link>
            <Link href="/categories" className="btn-ghost-ink">
              Explore Categories
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-orb">🪶</div>
          <div className="hero-stat-bar">
            <div className="hero-stat">
              <div className="h-section" style={{ fontSize: 28 }}>
                5K+
              </div>
              <div
                className="label-caps"
                style={{ marginTop: 4, fontSize: 10 }}
              >
                Happy Customers
              </div>
            </div>
            <div
              className="hero-stat"
              style={{ borderLeft: "1px solid rgba(0,0,0,0.08)" }}
            >
              <div className="h-section" style={{ fontSize: 28 }}>
                4.9
              </div>
              <div
                className="label-caps"
                style={{ marginTop: 4, fontSize: 10 }}
              >
                Avg Rating
              </div>
            </div>
            <div
              className="hero-stat"
              style={{ borderLeft: "1px solid rgba(0,0,0,0.08)" }}
            >
              <div className="h-section" style={{ fontSize: 28 }}>
                100%
              </div>
              <div
                className="label-caps"
                style={{ marginTop: 4, fontSize: 10 }}
              >
                Natural Fabrics
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div className="trust-bar">
        <div className="trust-inner">
          {[
            "Free Shipping",
            "✦",
            "Easy Returns",
            "✦",
            "Natural Fabrics",
            "✦",
            "5000+ Happy Customers",
            "✦",
            "New Season Collection",
            "✦",
            "High Quality",
            "✦",
            "Free Shipping ",
            "✦",
            "Easy Returns",
            "✦",
            "Natural Fabrics",
            "✦",
            "5000+ Happy Customers",
            "✦",
            "New Season Collection",
            "✦",
            "Handcrafted Quality",
            "✦",
          ].map((item, i) => (
            <span key={i} className={item === "✦" ? "trust-sep" : "trust-item"}>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── FEATURED PIECES ── */}
      {featuredProducts.length > 0 && (
        <section className="section">
          <div className="section-header">
            <div>
              <h2 className="h-section">Featured Pieces</h2>
            </div>
            <Link href="/products" className="btn-ghost-ink">
              View All <FaArrowRight size={10} />
            </Link>
          </div>
          <div className="product-grid-4">
            {featuredProducts.map((product) => {
              const discount =
                product.compare_price && product.compare_price > product.price
                  ? Math.round(
                      ((product.compare_price - product.price) /
                        product.compare_price) *
                        100,
                    )
                  : null;
              const outOfStock = product.stock_quantity === 0;

              return (
                <div key={product.id} className="product-card">
                  <div className="product-card-image">
                    <div className="ap-badge-wrap">
                      {outOfStock && (
                        <span className="ap-badge ap-badge-sold">Sold Out</span>
                      )}
                      {discount && !outOfStock && (
                        <span className="ap-badge ap-badge-sale">
                          −{discount}%
                        </span>
                      )}
                    </div>

                    <Link href={`/products/${product.id}`}>
                      <img src={getPrimaryImage(product)} alt={product.name} />
                    </Link>

                    <div className="product-card-overlay">
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={outOfStock}
                      >
                        {outOfStock ? (
                          "Out of Stock"
                        ) : (
                          <>
                            Add to Cart <FaArrowRight size={10} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="product-card-body">
                    <Link
                      href={`/products/${product.id}`}
                      className="product-card-name"
                    >
                      {product.name}
                    </Link>
                    <div>
                      <span className="product-card-price">
                        ${product.price}
                      </span>
                      {product.compare_price && (
                        <span className="product-card-compare">
                          ${product.compare_price}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── CATEGORIES ── */}
      <section className="category-section">
        <div className="section-header" style={{ marginBottom: 48 }}>
          <div>
            <h2 className="h-section">Categories</h2>
          </div>
          <Link href="/categories" className="btn-ghost-ink">
            View All <FaArrowRight size={10} />
          </Link>
        </div>
        <div className="category-grid">
          {displayCategories.map((cat) => {
            const categoryImage = getCategoryImage(cat);
            return (
              <Link
                key={cat.slug}
                href={`/categories/${cat.slug}`}
                className="category-card"
              >
                <div className="category-card-media">
                  {categoryImage ? (
                    <img src={categoryImage} alt={cat.name} />
                  ) : (
                    <div className="category-card-fallback">
                      {getCategoryIcon(cat)}
                    </div>
                  )}
                </div>
                <div className="category-card-scrim" />
                <div className="category-card-content">
                  <span className="category-card-line" />
                  <span className="category-name">{cat.name}</span>
                  <span className="category-desc">
                    {cat.description || cat.desc || "Explore Collection"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── BEST SELLERS ── */}
      {bestSellers.length > 0 && (
        <section className="section">
          <div className="section-header">
            <div>
              <h2 className="h-section">Best Sellers</h2>
            </div>
            <Link href="/products?sort=popular" className="btn-ghost-ink">
              View All <FaArrowRight size={10} />
            </Link>
          </div>
          <div className="product-grid-4">
            {bestSellers.map((product) => {
              const discount =
                product.compare_price && product.compare_price > product.price
                  ? Math.round(
                      ((product.compare_price - product.price) /
                        product.compare_price) *
                        100,
                    )
                  : null;
              const outOfStock = product.stock_quantity === 0;

              return (
                <div key={product.id} className="product-card">
                  <div className="product-card-image">
                    <div className="ap-badge-wrap">
                      {outOfStock && (
                        <span className="ap-badge ap-badge-sold">Sold Out</span>
                      )}
                      {discount && !outOfStock && (
                        <span className="ap-badge ap-badge-sale">
                          −{discount}%
                        </span>
                      )}
                    </div>

                    <Link href={`/products/${product.id}`}>
                      <img src={getPrimaryImage(product)} alt={product.name} />
                    </Link>

                    <div className="product-card-overlay">
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={outOfStock}
                      >
                        {outOfStock ? (
                          "Out of Stock"
                        ) : (
                          <>
                            Add to Cart <FaArrowRight size={10} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="product-card-body">
                    <Link
                      href={`/products/${product.id}`}
                      className="product-card-name"
                    >
                      {product.name}
                    </Link>
                    <div>
                      <span className="product-card-price">
                        ${product.price}
                      </span>
                      {product.compare_price && (
                        <span className="product-card-compare">
                          ${product.compare_price}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── NEW ARRIVALS ── */}
      {newArrivals.length > 0 && (
        <section
          className="section"
          style={{ background: "var(--surface-muted)" }}
        >
          <div className="section-header">
            <div>
              <h2 className="h-section">New Arrivals</h2>
            </div>
            <Link href="/products?new=true" className="btn-ghost-ink">
              View All <FaArrowRight size={10} />
            </Link>
          </div>
          <div className="product-grid-4">
            {newArrivals.map((product, idx) => {
              const discount =
                product.compare_price && product.compare_price > product.price
                  ? Math.round(
                      ((product.compare_price - product.price) /
                        product.compare_price) *
                        100,
                    )
                  : null;
              const outOfStock = product.stock_quantity === 0;
              const isNew = idx < 4;

              return (
                <div key={product.id} className="product-card">
                  <div className="product-card-image">
                    <div className="ap-badge-wrap">
                      {outOfStock && (
                        <span className="ap-badge ap-badge-sold">Sold Out</span>
                      )}
                      {isNew && !outOfStock && (
                        <div className="product-card-badge new">New</div>
                      )}
                      {discount && !outOfStock && !isNew && (
                        <span className="ap-badge ap-badge-sale">
                          −{discount}%
                        </span>
                      )}
                    </div>

                    <Link href={`/products/${product.id}`}>
                      <img src={getPrimaryImage(product)} alt={product.name} />
                    </Link>

                    <div className="product-card-overlay">
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={outOfStock}
                      >
                        {outOfStock ? (
                          "Out of Stock"
                        ) : (
                          <>
                            Add to Cart <FaArrowRight size={10} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="product-card-body">
                    <Link
                      href={`/products/${product.id}`}
                      className="product-card-name"
                    >
                      {product.name}
                    </Link>
                    <div>
                      <span className="product-card-price">
                        ${product.price}
                      </span>
                      {product.compare_price && (
                        <span className="product-card-compare">
                          ${product.compare_price}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── REVIEW ── */}
      <section className="review-section">
        <div>
          <FaQuoteLeft size={24} className="review-quote-icon" />
          <p className="review-text">
            "The quality of the linen is unmatched. It truly feels like wearing
            air — I've never experienced comfort like this from a clothing
            brand."
          </p>
          <div className="review-author">
            <div className="review-avatar">🌿</div>
            <div>
              <div
                style={{
                  fontFamily: "Jost",
                  fontWeight: 500,
                  fontSize: 14,
                  letterSpacing: "0.05em",
                  color: "var(--ink)",
                }}
              >
                Ahmed Maxamed
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 4,
                }}
              >
                {renderStars(5)}
                <span
                  className="label-caps"
                  style={{ fontSize: 10, color: "var(--ink-faint)" }}
                >
                  Verified Customer
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="review-stat-grid">
          {[
            { num: "5K+", label: "Happy Customers" },
            { num: "4.9", label: "Average Rating" },
            { num: "98%", label: "Would Recommend" },
            { num: "5yr", label: "Trusted Brand" },
          ].map((s) => (
            <div key={s.label} className="review-stat">
              <div className="review-stat-num">{s.num}</div>
              <div
                className="label-caps"
                style={{ fontSize: 10, color: "var(--ink-soft)" }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}