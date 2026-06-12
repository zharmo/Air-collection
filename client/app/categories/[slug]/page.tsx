"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";
import axiosInstance from "@/utils/axiosConfig";
import { useCart } from "@/context/CartContext";

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  compare_price?: number;
  images: { image_url: string; is_primary: boolean }[];
  stock_quantity: number;
}

export default function CategoryProductsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { addToCart } = useCart();

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
    "http://localhost:5000";

  useEffect(() => {
    const fetchCategoryAndProducts = async () => {
      try {
        const categoriesRes = await axiosInstance.get("/categories");
        const categories = categoriesRes.data.data;
        const found = categories.find((c: Category) => c.slug === slug);
        if (!found) {
          setError("Category not found");
          setLoading(false);
          return;
        }
        setCategory(found);
        const productsRes = await axiosInstance.get(
          `/products?categoryId=${found.id}`,
        );
        setProducts(productsRes.data.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchCategoryAndProducts();
  }, [slug]);

  const getPrimaryImage = (product: Product) => {
    const primary = product.images?.find((img) => img.is_primary);
    const imagePath = primary?.image_url || product.images?.[0]?.image_url;
    if (!imagePath) return "/images/placeholders/placeholder.jpg";
    if (imagePath.startsWith("/uploads")) return `${backendUrl}${imagePath}`;
    return imagePath;
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product.id, 1, {
      name: product.name,
      price: Number(product.price),
      image: getPrimaryImage(product),
    });
  };

  const formatPrice = (value?: number) => {
    if (value === undefined || value === null) return "";
    return Number(value).toFixed(2);
  };

  const getDiscount = (product: Product) => {
    const price = Number(product.price);
    const comparePrice = Number(product.compare_price);
    if (!comparePrice || comparePrice <= price) return null;
    return Math.round(((comparePrice - price) / comparePrice) * 100);
  };

  if (loading) {
    return (
      <>
        <CategoryProductStyles />
        <div className="cp-loading">
          <div className="spinner-border text-dark" />
        </div>
      </>
    );
  }

  if (error || !category) {
    notFound();
  }

  return (
    <>
      <CategoryProductStyles />
      <div className="cp-page">
        <div className="ap-header">
          <p className="ap-header-eyebrow">Category</p>
          <h1>{category.name}</h1>
          {category.description && <p>{category.description}</p>}
          <span>
            {products.length} {products.length === 1 ? "item" : "items"}
          </span>
        </div>

        {products.length === 0 ? (
          <div className="ap-empty">
            <div className="ap-empty-icon">...</div>
            <h3>No products yet</h3>
            <p>Check back soon for new arrivals in {category.name}.</p>
            <Link href="/products" className="ap-empty-btn">
              Continue Shopping <FaArrowRight size={10} />
            </Link>
          </div>
        ) : (
          <div className="ap-grid">
            {products.map((product, idx) => {
              const discount = getDiscount(product);
              const outOfStock = product.stock_quantity === 0;

              return (
                <div
                  key={product.id}
                  className="ap-card"
                  style={{ animationDelay: `${idx * 0.04}s` }}
                >
                  <div className="ap-card-img">
                    <div className="ap-badge-wrap">
                      {outOfStock && (
                        <span className="ap-badge ap-badge-sold">Sold Out</span>
                      )}
                      {discount && !outOfStock && (
                        <span className="ap-badge ap-badge-sale">
                          -{discount}%
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/products/${product.id}`}
                      style={{ display: "contents" }}
                    >
                      <img src={getPrimaryImage(product)} alt={product.name} />
                    </Link>

                    <div className="ap-card-overlay">
                      <button
                        className="ap-overlay-btn"
                        onClick={() => handleAddToCart(product)}
                        disabled={outOfStock}
                      >
                        {outOfStock ? (
                          "Out of Stock"
                        ) : (
                          <>
                            Add to Cart <FaArrowRight size={9} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="ap-card-body">
                    <p className="ap-card-cat">{category.name}</p>
                    <Link
                      href={`/products/${product.id}`}
                      className="ap-card-name"
                    >
                      {product.name}
                    </Link>
                    <div className="ap-card-price-row">
                      <span className="ap-card-price">
                        ${formatPrice(product.price)}
                      </span>
                      {product.compare_price && (
                        <span className="ap-card-compare">
                          ${formatPrice(product.compare_price)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function CategoryProductStyles() {
  return (
    <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Jost:wght@300;400;500;600&display=swap');

                *, *::before, *::after { box-sizing: border-box; }

                :root {
                    --ink:        #0a0a0a;
                    --ink-soft:   #5c5c5c;
                    --ink-faint:  #aaa;
                    --white:      #ffffff;
                    --warm:       #fafaf7;
                    --muted:      #f4f2ef;
                    --product-bg: #f7f6f3;
                    --accent:     #c8a96e;
                    --danger:     #c0392b;
                    --border:     rgba(0,0,0,0.08);
                    --shadow-lg:  0 16px 55px rgba(0,0,0,0.14);
                }

                .cp-page {
                    width: 100%;
                    max-width: 1220px;
                    margin: 0 auto;
                    padding: 52px 28px 76px;
                }

                .cp-loading {
                    min-height: 60vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .ap-header {
                    text-align: center;
                    padding: 18px 20px 46px;
                }
                .ap-header-eyebrow {
                    font-family: 'Jost', sans-serif;
                    font-size: 11px;
                    font-weight: 600;
                    letter-spacing: .22em;
                    text-transform: uppercase;
                    color: var(--accent);
                    margin: 0 0 10px;
                }
                .ap-header h1 {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: clamp(42px, 5vw, 72px);
                    font-weight: 500;
                    color: var(--ink);
                    line-height: .95;
                    margin: 0;
                }
                .ap-header p {
                    max-width: 560px;
                    margin: 16px auto 0;
                    font-family: 'Jost', sans-serif;
                    font-size: 15px;
                    font-weight: 300;
                    color: var(--ink-soft);
                    line-height: 1.7;
                }
                .ap-header span {
                    display: inline-block;
                    margin-top: 16px;
                    font-family: 'Jost', sans-serif;
                    font-size: 11px;
                    font-weight: 600;
                    letter-spacing: .18em;
                    text-transform: uppercase;
                    color: var(--ink-faint);
                }

                .ap-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                }

                .ap-card {
                    background: var(--white);
                    display: flex;
                    flex-direction: column;
                    position: relative;
                    cursor: pointer;
                    transition: box-shadow .35s cubic-bezier(.16,1,.3,1), transform .35s cubic-bezier(.16,1,.3,1);
                }
                .ap-card:hover {
                    box-shadow: var(--shadow-lg);
                    transform: translateY(-3px);
                }

                .ap-card-img {
                    background: var(--product-bg);
                    aspect-ratio: 6/7;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    position: relative;
                }
                .ap-card-img img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    padding: 0;
                    transition: transform .55s cubic-bezier(.16,1,.3,1);
                }
                .ap-card:hover .ap-card-img img { transform: scale(1.06); }

                .ap-badge-wrap {
                    position: absolute;
                    top: 12px;
                    left: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                    z-index: 2;
                }
                .ap-badge {
                    font-family: 'Jost', sans-serif;
                    font-size: 9px;
                    font-weight: 700;
                    letter-spacing: .08em;
                    text-transform: uppercase;
                    padding: 3px 6px;
                    display: inline-block;
                    width: fit-content;
                }
                .ap-badge-sale { background: var(--ink); color: #fff; }
                .ap-badge-sold {
                    background: rgba(255,255,255,.9);
                    color: var(--danger);
                    border: 1px solid rgba(192,57,43,.2);
                }

                .ap-card-overlay {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: var(--ink);
                    padding: 12px 10px;
                    transform: translateY(100%);
                    transition: transform .32s cubic-bezier(.16,1,.3,1);
                    z-index: 3;
                }
                .ap-card:hover .ap-card-overlay { transform: translateY(0); }
                .ap-overlay-btn {
                    width: 100%;
                    background: none;
                    border: none;
                    font-family: 'Jost', sans-serif;
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: .2em;
                    text-transform: uppercase;
                    color: #fff;
                    cursor: pointer;
                    padding: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    transition: opacity .2s;
                }
                .ap-overlay-btn:hover { opacity: .7; }
                .ap-overlay-btn:disabled { opacity: .35; cursor: not-allowed; }

                .ap-card-body {
                    padding: 16px 4px 8px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                .ap-card-cat {
                    font-family: 'Jost', sans-serif;
                    font-size: 10px;
                    font-weight: 500;
                    letter-spacing: .16em;
                    text-transform: uppercase;
                    color: var(--ink-faint);
                    margin-bottom: 4px;
                }
                .ap-card-name {
                    font-family: 'Jost', sans-serif;
                    font-size: 14px;
                    font-weight: 400;
                    color: var(--ink);
                    text-decoration: none;
                    letter-spacing: .01em;
                    display: block;
                    margin-bottom: 10px;
                    line-height: 1.4;
                    flex: 1;
                    transition: opacity .2s;
                }
                .ap-card-name:hover { opacity: .55; }
                .ap-card-price-row {
                    display: flex;
                    align-items: baseline;
                    gap: 8px;
                }
                .ap-card-price {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 20px;
                    font-weight: 600;
                    color: var(--ink);
                }
                .ap-card-compare {
                    font-family: 'Jost', sans-serif;
                    font-size: 12px;
                    font-weight: 300;
                    color: var(--ink-faint);
                    text-decoration: line-through;
                }

                .ap-empty {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 360px;
                    padding: 80px 24px;
                    text-align: center;
                    gap: 18px;
                }
                .ap-empty-icon {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: var(--muted);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--ink-faint);
                    letter-spacing: .08em;
                }
                .ap-empty h3 {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 28px;
                    font-weight: 500;
                    color: var(--ink);
                    margin: 0;
                }
                .ap-empty p {
                    font-family: 'Jost', sans-serif;
                    font-size: 14px;
                    font-weight: 300;
                    color: var(--ink-soft);
                    margin: 0;
                    max-width: 340px;
                }
                .ap-empty-btn {
                    font-family: 'Jost', sans-serif;
                    font-size: 11px;
                    font-weight: 600;
                    letter-spacing: .18em;
                    text-transform: uppercase;
                    text-decoration: none;
                    color: #fff;
                    background: var(--ink);
                    border: none;
                    padding: 14px 32px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    transition: opacity .2s;
                }
                .ap-empty-btn:hover { opacity: .75; }

                @media (max-width: 1100px) {
                    .ap-grid { grid-template-columns: repeat(2, 1fr); }
                }
                @media (max-width: 768px) {
                    .cp-page { padding: 34px 16px 60px; }
                    .ap-header { padding: 8px 12px 32px; }
                    .ap-grid { grid-template-columns: repeat(2, 1fr); gap: 18px; }
                }
                @media (max-width: 480px) {
                    .ap-grid { grid-template-columns: 1fr 1fr; gap: 15px; }
                    .ap-card-body { padding-top: 12px; }
                    .ap-card-name { font-size: 13px; }
                    .ap-card-price { font-size: 18px; }
                }
            `}</style>
  );
}
