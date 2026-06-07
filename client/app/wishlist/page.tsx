'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaArrowRight, FaHeart, FaSort } from 'react-icons/fa';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import axiosInstance from '@/utils/axiosConfig';

interface WishlistItem {
    product_id: number;
    name: string;
    price: number;
    compare_price?: number;
    category_name?: string;
    stock_quantity: number;
    image?: string;
}

type FilterOption = 'all' | 'lowstock' | 'instock';
type SortOption = 'default' | 'price-asc' | 'price-desc';

const SORT_LABELS: Record<SortOption, string> = {
    default: 'Featured',
    'price-asc': 'Price: Low to High',
    'price-desc': 'Price: High to Low',
};

export default function WishlistPage() {
    const { wishlist, removeFromWishlist, fetchWishlist } = useWishlist();
    const { addToCart } = useCart();
    const [items, setItems] = useState<WishlistItem[]>([]);
    const [filteredItems, setFilteredItems] = useState<WishlistItem[]>([]);
    const [filter, setFilter] = useState<FilterOption>('all');
    const [sortBy, setSortBy] = useState<SortOption>('default');
    const [loading, setLoading] = useState(true);

    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

    useEffect(() => {
        const fetchWishlistProducts = async () => {
            if (!wishlist.items.length) {
                setItems([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const productPromises = wishlist.items.map((item) =>
                    axiosInstance.get(`/products/${item.product_id}`).then((res) => res.data.data)
                );
                const products = await Promise.all(productPromises);
                const enriched = products.map((prod) => ({
                    product_id: prod.id,
                    name: prod.name,
                    price: Number(prod.price),
                    compare_price: prod.compare_price ? Number(prod.compare_price) : undefined,
                    category_name: prod.category_name,
                    stock_quantity: prod.stock_quantity,
                    image: prod.images?.find((img: any) => img.is_primary)?.image_url || prod.images?.[0]?.image_url,
                }));
                setItems(enriched);
            } catch (error) {
                console.error('Failed to fetch wishlist products', error);
            } finally {
                setLoading(false);
            }
        };

        fetchWishlistProducts();
    }, [wishlist.items]);

    useEffect(() => {
        let filtered = [...items];

        if (filter === 'lowstock') {
            filtered = filtered.filter((item) => item.stock_quantity > 0 && item.stock_quantity <= 5);
        } else if (filter === 'instock') {
            filtered = filtered.filter((item) => item.stock_quantity > 0);
        }

        if (sortBy === 'price-asc') {
            filtered.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'price-desc') {
            filtered.sort((a, b) => b.price - a.price);
        }

        setFilteredItems(filtered);
    }, [items, filter, sortBy]);

    const handleMoveToBag = async (item: WishlistItem) => {
        await addToCart(item.product_id, 1, {
            name: item.name,
            price: Number(item.price),
            image: getFullImageUrl(item.image),
        });
        await removeFromWishlist(item.product_id);
        await fetchWishlist();
    };

    const getFullImageUrl = (imagePath?: string) => {
        if (!imagePath) return '/images/placeholders/placeholder.jpg';
        if (imagePath.startsWith('/uploads')) return `${backendUrl}${imagePath}`;
        return imagePath;
    };

    const getDiscount = (item: WishlistItem) => {
        if (!item.compare_price || item.compare_price <= item.price) return null;
        return Math.round(((item.compare_price - item.price) / item.compare_price) * 100);
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Jost:wght@300;400;500;600&display=swap');

                *, *::before, *::after { box-sizing: border-box; }

                :root {
                    --ink: #0a0a0a;
                    --ink-soft: #5c5c5c;
                    --ink-faint: #aaa;
                    --white: #ffffff;
                    --warm: #fafaf7;
                    --muted: #f4f2ef;
                    --product-bg: #f7f6f3;
                    --accent: #c8a96e;
                    --danger: #c0392b;
                    --border: rgba(0,0,0,0.08);
                    --border-md: rgba(0,0,0,0.13);
                    --shadow-lg: 0 16px 55px rgba(0,0,0,0.14);
                }

                .wl-page {
                    max-width: 1220px;
                    margin: 0 auto;
                    padding: 52px 28px 76px;
                }

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
                    text-align: center;
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

                .wl-toolbar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 16px;
                    margin-bottom: 28px;
                    border-bottom: 1px solid var(--border);
                    padding-bottom: 18px;
                }
                .wl-filter-row {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                .wl-chip,
                .wl-sort {
                    font-family: 'Jost', sans-serif;
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: .16em;
                    text-transform: uppercase;
                    border: 1px solid var(--border-md);
                    background: var(--white);
                    color: var(--ink);
                    min-height: 38px;
                    padding: 0 16px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: background .2s, color .2s, border-color .2s;
                }
                .wl-chip:hover,
                .wl-sort:hover { border-color: var(--ink); }
                .wl-chip.active {
                    background: var(--ink);
                    color: #fff;
                    border-color: var(--ink);
                }
                .wl-sort-wrap { position: relative; }
                .wl-sort-menu {
                    position: absolute;
                    top: calc(100% + 8px);
                    right: 0;
                    min-width: 210px;
                    background: var(--white);
                    border: 1px solid var(--border);
                    box-shadow: var(--shadow-lg);
                    padding: 6px;
                    display: none;
                    z-index: 10;
                }
                .wl-sort-wrap:hover .wl-sort-menu,
                .wl-sort-wrap:focus-within .wl-sort-menu { display: block; }
                .wl-sort-option {
                    width: 100%;
                    border: none;
                    background: transparent;
                    text-align: left;
                    padding: 10px 12px;
                    font-family: 'Jost', sans-serif;
                    font-size: 12px;
                    color: var(--ink-soft);
                    cursor: pointer;
                }
                .wl-sort-option:hover,
                .wl-sort-option.active {
                    color: var(--ink);
                    background: var(--muted);
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
                .wl-heart-btn {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    width: 34px;
                    height: 34px;
                    border-radius: 50%;
                    border: none;
                    background: rgba(255,255,255,.92);
                    color: var(--danger);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    z-index: 4;
                    transition: transform .2s;
                }
                .wl-heart-btn:hover { transform: scale(1.08); }
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
                .ap-empty {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 100px 24px;
                    text-align: center;
                    gap: 20px;
                }
                .ap-empty-icon {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: var(--muted);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 28px;
                    color: var(--ink-faint);
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
                    max-width: 300px;
                }
                .ap-empty-btn {
                    font-family: 'Jost', sans-serif;
                    font-size: 11px;
                    font-weight: 600;
                    letter-spacing: .18em;
                    text-transform: uppercase;
                    color: #fff;
                    background: var(--ink);
                    border: none;
                    padding: 14px 32px;
                    text-decoration: none;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    transition: opacity .2s;
                }
                .ap-empty-btn:hover { opacity: .75; }
                .wl-loading {
                    min-height: 60vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                @media (max-width: 1100px) {
                    .ap-grid { grid-template-columns: repeat(2, 1fr); }
                }
                @media (max-width: 768px) {
                    .wl-page { padding: 34px 16px 60px; }
                    .ap-header { padding: 8px 12px 32px; }
                    .wl-toolbar { align-items: stretch; flex-direction: column; }
                    .wl-sort { width: 100%; }
                    .wl-sort-menu { left: 0; right: 0; }
                    .ap-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
                }
                @media (max-width: 480px) {
                    .ap-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
                    .ap-card-body { padding-top: 12px; }
                    .ap-card-name { font-size: 13px; }
                    .ap-card-price { font-size: 18px; }
                    .wl-chip { flex: 1; padding: 0 10px; }
                }
            `}</style>

            <div className="wl-page">
                <div className="ap-header">
                    <p className="ap-header-eyebrow">The Collection</p>
                    <h1>Wishlist</h1>
                    <p className="ap-header-sub">{filteredItems.length} saved items</p>
                </div>

                <div className="wl-toolbar">
                    <div className="wl-filter-row">
                        {[
                            ['all', 'All'],
                            ['lowstock', 'Low Stock'],
                            ['instock', 'In Stock'],
                        ].map(([value, label]) => (
                            <button
                                key={value}
                                className={`wl-chip${filter === value ? ' active' : ''}`}
                                onClick={() => setFilter(value as FilterOption)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="wl-sort-wrap">
                        <button className="wl-sort">
                            <FaSort size={12} /> {SORT_LABELS[sortBy]}
                        </button>
                        <div className="wl-sort-menu">
                            {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
                                <button
                                    key={option}
                                    className={`wl-sort-option${sortBy === option ? ' active' : ''}`}
                                    onClick={() => setSortBy(option)}
                                >
                                    {SORT_LABELS[option]}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="wl-loading">
                        <div className="spinner-border text-dark" role="status" />
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="ap-empty">
                        <div className="ap-empty-icon">...</div>
                        <h3>Your wishlist is empty</h3>
                        <p>Save items you love to see them here.</p>
                        <Link href="/products" className="ap-empty-btn">
                            Start Shopping <FaArrowRight size={10} />
                        </Link>
                    </div>
                ) : (
                    <div className="ap-grid">
                        {filteredItems.map((item, idx) => {
                            const discount = getDiscount(item);
                            const isOutOfStock = item.stock_quantity === 0;

                            return (
                                <div
                                    key={item.product_id}
                                    className="ap-card"
                                    style={{ animationDelay: `${idx * 0.04}s` }}
                                >
                                    <div className="ap-card-img">
                                        <div className="ap-badge-wrap">
                                            {isOutOfStock && (
                                                <span className="ap-badge ap-badge-sold">Sold Out</span>
                                            )}
                                            {discount && !isOutOfStock && (
                                                <span className="ap-badge ap-badge-sale">-{discount}%</span>
                                            )}
                                        </div>

                                        <button
                                            className="wl-heart-btn"
                                            onClick={() => removeFromWishlist(item.product_id)}
                                            aria-label="Remove from wishlist"
                                        >
                                            <FaHeart size={14} />
                                        </button>

                                        <Link href={`/products/${item.product_id}`} style={{ display: 'contents' }}>
                                            <img src={getFullImageUrl(item.image)} alt={item.name} />
                                        </Link>

                                        <div className="ap-card-overlay">
                                            <button
                                                className="ap-overlay-btn"
                                                onClick={() => handleMoveToBag(item)}
                                                disabled={isOutOfStock}
                                            >
                                                {isOutOfStock ? (
                                                    'Out of Stock'
                                                ) : (
                                                    <>
                                                        Move to Cart <FaArrowRight size={9} />
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="ap-card-body">
                                        <p className="ap-card-cat">{item.category_name || 'Collection'}</p>
                                        <Link href={`/products/${item.product_id}`} className="ap-card-name">
                                            {item.name}
                                        </Link>
                                        <div className="ap-card-price-row">
                                            <span className="ap-card-price">${item.price}</span>
                                            {item.compare_price && (
                                                <span className="ap-card-compare">${item.compare_price}</span>
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
