'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaArrowRight, FaSearch } from 'react-icons/fa';
import { useCart } from '@/context/CartContext';
import axiosInstance from '@/utils/axiosConfig';

interface Product {
    id: number;
    name: string;
    price: number;
    compare_price?: number;
    images: { image_url: string; is_primary: boolean }[];
    category_name: string;
    stock_quantity: number;
}

function SearchResultsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const query = searchParams.get('q') || '';
    const { addToCart } = useCart();

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

    useEffect(() => {
        if (!query) {
            setLoading(false);
            return;
        }

        const fetchSearchResults = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await axiosInstance.get(`/products?search=${encodeURIComponent(query)}`);
                setProducts(res.data.data);
            } catch (err) {
                console.error(err);
                setError('Failed to load search results');
            } finally {
                setLoading(false);
            }
        };

        fetchSearchResults();
    }, [query]);

    const getPrimaryImage = (product: Product) => {
        const primary = product.images?.find((img) => img.is_primary);
        const imagePath = primary?.image_url || product.images?.[0]?.image_url;
        if (!imagePath) return '/images/placeholders/placeholder.jpg';
        if (imagePath.startsWith('/uploads')) return `${backendUrl}${imagePath}`;
        return imagePath;
    };

    const handleAddToCart = (product: Product) => {
        addToCart(product.id, 1, {
            name: product.name,
            price: Number(product.price),
            image: getPrimaryImage(product),
        });
    };

    const getDiscount = (product: Product) => {
        const price = Number(product.price);
        const comparePrice = Number(product.compare_price);
        if (!comparePrice || comparePrice <= price) return null;
        return Math.round(((comparePrice - price) / comparePrice) * 100);
    };

    return (
        <>
            <SearchStyles />
            <div className="search-page">
                <button onClick={() => router.back()} className="search-back" aria-label="Go back">
                    <FaArrowLeft size={14} />
                </button>

                <header className="ap-header">
                    <p className="ap-header-eyebrow">The Collection</p>
                    <h1>Search Results</h1>
                    <p className="ap-header-sub">
                        {query
                            ? `${products.length} ${products.length === 1 ? 'result' : 'results'} for "${query}"`
                            : 'Please enter a product name to search.'}
                    </p>
                </header>

                {!query ? (
                    <div className="ap-empty">
                        <div className="ap-empty-icon">
                            <FaSearch size={22} />
                        </div>
                        <h3>No search term entered</h3>
                        <p>Please enter a product name to search.</p>
                        <Link href="/" className="ap-empty-btn">
                            Back to Home <FaArrowRight size={10} />
                        </Link>
                    </div>
                ) : loading ? (
                    <div className="search-loading">
                        <div className="spinner-border text-dark" role="status" />
                        <p>Searching for "{query}"...</p>
                    </div>
                ) : error ? (
                    <div className="ap-empty">
                        <h3>Something went wrong</h3>
                        <p>{error}</p>
                        <Link href="/" className="ap-empty-btn">
                            Back to Home <FaArrowRight size={10} />
                        </Link>
                    </div>
                ) : products.length === 0 ? (
                    <div className="ap-empty">
                        <div className="ap-empty-icon">
                            <FaSearch size={22} />
                        </div>
                        <h3>No products found</h3>
                        <p>We couldn't find any products matching "{query}".</p>
                        <Link href="/categories" className="ap-empty-btn">
                            Browse Categories <FaArrowRight size={10} />
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
                                                <span className="ap-badge ap-badge-sale">-{discount}%</span>
                                            )}
                                        </div>

                                        <Link href={`/products/${product.id}`} style={{ display: 'contents' }}>
                                            <img src={getPrimaryImage(product)} alt={product.name} />
                                        </Link>

                                        <div className="ap-card-overlay">
                                            <button
                                                className="ap-overlay-btn"
                                                onClick={() => handleAddToCart(product)}
                                                disabled={outOfStock}
                                            >
                                                {outOfStock ? (
                                                    'Out of Stock'
                                                ) : (
                                                    <>
                                                        Add to Cart <FaArrowRight size={9} />
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="ap-card-body">
                                        <p className="ap-card-cat">{product.category_name || 'Collection'}</p>
                                        <Link href={`/products/${product.id}`} className="ap-card-name">
                                            {product.name}
                                        </Link>
                                        <div className="ap-card-price-row">
                                            <span className="ap-card-price">${product.price}</span>
                                            {product.compare_price && (
                                                <span className="ap-card-compare">${product.compare_price}</span>
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

function SearchStyles() {
    return (
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Jost:wght@300;400;500;600&display=swap');

            *, *::before, *::after { box-sizing: border-box; }

            :root {
                --ink: #0a0a0a;
                --ink-soft: #5c5c5c;
                --ink-faint: #aaa;
                --white: #ffffff;
                --muted: #f4f2ef;
                --product-bg: #f7f6f3;
                --accent: #c8a96e;
                --danger: #c0392b;
                --border: rgba(0,0,0,0.08);
                --border-md: rgba(0,0,0,0.13);
                --shadow-lg: 0 16px 55px rgba(0,0,0,0.14);
            }

            .search-page {
                max-width: 1220px;
                margin: 0 auto;
                padding: 52px 28px 76px;
                position: relative;
            }

            .search-back {
                position: absolute;
                top: 52px;
                left: 28px;
                width: 38px;
                height: 38px;
                border: 1px solid var(--border-md);
                background: var(--white);
                color: var(--ink);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: border-color .2s;
            }
            .search-back:hover { border-color: var(--ink); }

            .ap-header {
                text-align: center;
                padding: 18px 20px 42px;
            }
            .ap-header-eyebrow {
                font-family: 'Jost', sans-serif;
                font-size: 10px;
                font-weight: 500;
                letter-spacing: .22em;
                text-transform: uppercase;
                color: var(--ink-faint);
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
            .ap-header-sub {
                font-family: 'Jost', sans-serif;
                font-size: 13px;
                font-weight: 300;
                color: var(--ink-soft);
                margin: 16px auto 0;
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
                aspect-ratio: 1/1;
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
                padding: 14px 20px;
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

            .ap-empty,
            .search-loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 100px 24px;
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
            }
            .ap-empty h3 {
                font-family: 'Cormorant Garamond', serif;
                font-size: 28px;
                font-weight: 500;
                color: var(--ink);
                margin: 0;
            }
            .ap-empty p,
            .search-loading p {
                font-family: 'Jost', sans-serif;
                font-size: 14px;
                font-weight: 300;
                color: var(--ink-soft);
                margin: 0;
                max-width: 360px;
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
                .search-page { padding: 34px 16px 60px; }
                .search-back { position: static; margin-bottom: 20px; }
                .ap-header { padding: 8px 12px 32px; }
                .ap-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
            }
            @media (max-width: 480px) {
                .ap-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
                .ap-card-body { padding-top: 12px; }
                .ap-card-name { font-size: 13px; }
                .ap-card-price { font-size: 18px; }
            }
        `}</style>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="container py-5 text-center"><div className="spinner-border text-dark" /></div>}>
            <SearchResultsContent />
        </Suspense>
    );
}
