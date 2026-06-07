'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
    FaStar, FaStarHalfAlt, FaRegStar,
    FaTruck, FaUndo, FaHeart, FaArrowRight,
    FaShieldAlt, FaLeaf, FaMinus, FaPlus, FaChevronLeft
} from 'react-icons/fa';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import axiosInstance from '@/utils/axiosConfig';

interface ColorVariant { id: number; color_name: string; image_url: string; }
interface SizeVariant  { id: number; color_id: number | null; size_name: string; measurements: any; stock: number; is_available: boolean; }
interface Product {
    id: number; name: string; price: number; compare_price?: number;
    description: string; sustainability?: string; rating: number; reviewCount: number;
    images: { id: number; image_url: string; is_primary: boolean; color?: string }[];
    colors: ColorVariant[]; sizes: SizeVariant[]; stock_quantity: number;
    deliveryBadges?: { text: string }[];
    reviews?: { id: number; author: string; rating: number; date: string; text: string }[];
    relatedProducts?: { id: number; name: string; price: number; image: string }[];
    recommendedProducts?: { id: number; name: string; price: number; image: string }[];
}

export default function ProductDetailPage() {
    const params = useParams();
    const productId = params.productId;
    const { addToCart } = useCart();
    const { addToWishlist, removeFromWishlist, wishlist } = useWishlist();

    const [product, setProduct]           = useState<Product | null>(null);
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<ColorVariant | null>(null);
    const [selectedSize, setSelectedSize]   = useState<SizeVariant | null>(null);
    const [quantity, setQuantity]         = useState(1);
    const [mainImage, setMainImage]       = useState('');
    const [activeThumb, setActiveThumb]   = useState(0);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [addedToCart, setAddedToCart]   = useState(false);
    const [sizeError, setSizeError]       = useState(false);

    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

    const getFullImageUrl = (url: string) => {
        if (!url) return '/images/placeholders/placeholder.jpg';
        if (url.startsWith('/uploads')) return `${backendUrl}${url}`;
        return url;
    };

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res  = await axiosInstance.get(`/products/${productId}`);
                const prod = res.data.data;
                setProduct(prod);
                if (prod.colors?.length) {
                    setSelectedColor(prod.colors[0]);
                    setMainImage(getFullImageUrl(prod.colors[0].image_url));
                } else if (prod.images?.length) {
                    const primary = prod.images.find((img: any) => img.is_primary) || prod.images[0];
                    setMainImage(getFullImageUrl(primary.image_url));
                }
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to load product');
            } finally {
                setLoading(false);
            }
        };
        if (productId) fetchProduct();
    }, [productId]);

    useEffect(() => {
        if (product && wishlist?.items)
            setIsWishlisted(wishlist.items.some((item: any) => item.product_id === product.id));
    }, [wishlist, product]);

    useEffect(() => {
        if (selectedColor) {
            setMainImage(getFullImageUrl(selectedColor.image_url));
            setSelectedSize(null);
            setActiveThumb(0);
        }
    }, [selectedColor]);

    useEffect(() => {
        if (selectedColor && product) {
            const available = filteredSizes().find(s => s.is_available && s.stock > 0);
            setSelectedSize(available || null);
        }
    }, [selectedColor, product]);

    const filteredSizes = () => {
        if (!product) return [];
        if (!selectedColor) return product.sizes.filter(s => s.color_id === null);
        return product.sizes.filter(s => s.color_id === null || s.color_id === selectedColor.id);
    };

    const allThumbs = () => {
        if (!product) return [];
        const imgs: string[] = [];
        if (selectedColor?.image_url) imgs.push(getFullImageUrl(selectedColor.image_url));
        product.images.forEach(img => {
            const url = getFullImageUrl(img.image_url);
            if (!imgs.includes(url)) imgs.push(url);
        });
        return imgs;
    };

    const handleThumbClick = (url: string, idx: number) => {
        setMainImage(url);
        setActiveThumb(idx);
    };

    const handleAddToCart = async () => {
        if (!selectedSize) { setSizeError(true); setTimeout(() => setSizeError(false), 2000); return; }
        let imageUrl = '';
        if (selectedColor?.image_url) imageUrl = getFullImageUrl(selectedColor.image_url);
        else if (product?.images?.length) {
            const primary = product.images.find(img => img.is_primary) || product.images[0];
            imageUrl = getFullImageUrl(primary.image_url);
        }
        // FIX: ensure price is a number (convert from any possible string)
        const numericPrice = Number(product!.price);
        await addToCart(product!.id, quantity, {
            size: selectedSize.size_name,
            color: selectedColor?.color_name,
            name: product!.name,
            price: numericPrice,
            image: imageUrl,
        });
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2500);
    };

    const handleBuyNow = async () => {
        await handleAddToCart();
        window.location.href = '/cart';
    };

    const handleToggleWishlist = () => {
        if (isWishlisted) removeFromWishlist(product!.id);
        else addToWishlist(product!.id);
    };

    const renderStars = (rating: number) => {
        const full = Math.floor(rating), half = rating % 1 !== 0, empty = 5 - full - (half ? 1 : 0);
        return (
            <span style={{ display:'inline-flex', gap:2 }}>
                {[...Array(full)].map((_,i)  => <FaStar key={i}     style={{ color:'#c8a96e' }} />)}
                {half &&                          <FaStarHalfAlt     style={{ color:'#c8a96e' }} />}
                {[...Array(empty)].map((_,i) => <FaRegStar key={i}  style={{ color:'#c8a96e' }} />)}
            </span>
        );
    };

    const thumbs   = allThumbs();
    const discount = product?.compare_price
        ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
        : null;

    /* ─── Loading ─── */
    if (loading) return (
        <div style={{ minHeight:'80vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
            <div style={{ textAlign:'center' }}>
                <div style={{ width:36, height:36, border:'1.5px solid #eee', borderTopColor:'#0a0a0a', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 16px' }} />
                <p style={{ fontFamily:'Jost,sans-serif', fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', color:'#aaa' }}>Loading</p>
            </div>
        </div>
    );

    /* ─── Error ─── */
    if (error || !product) return (
        <div style={{ minHeight:'70vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:24 }}>
            <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:28, color:'#0a0a0a' }}>Product not found</p>
            <Link href="/" style={{ fontFamily:'Jost,sans-serif', fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', color:'#0a0a0a', textDecoration:'none', borderBottom:'1px solid #0a0a0a', paddingBottom:2 }}>
                ← Back to Home
            </Link>
        </div>
    );

    const availableSizes = filteredSizes();

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Jost:wght@300;400;500;600&display=swap');

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
                    --accent-lt:  #f0e8d8;
                    --success:    #2d7a4f;
                    --danger:     #c0392b;
                    --border:     rgba(0,0,0,0.08);
                    --border-md:  rgba(0,0,0,0.13);
                }

                /* ── Page wrapper ── */
                .pd-page {
                    max-width: 1360px;
                    margin: 0 auto;
                    padding: 40px 40px 100px;
                    background: var(--white);
                }

                /* ── Breadcrumb ── */
                .pd-crumb {
                    display: flex; align-items: center; gap: 10px;
                    margin-bottom: 36px;
                    font-family: 'Jost', sans-serif;
                    font-size: 11px; font-weight: 400;
                    letter-spacing: 0.12em; text-transform: uppercase;
                    color: var(--ink-faint);
                }
                .pd-crumb a {
                    color: var(--ink-faint); text-decoration: none;
                    transition: color .2s;
                }
                .pd-crumb a:hover { color: var(--ink); }
                .pd-crumb-sep { font-size: 9px; opacity: .4; }

                /* ── Two-column layout ── */
                .pd-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 64px;
                    align-items: start;
                }

                /* ── Gallery ── */
                .pd-gallery { position: sticky; top: 90px; }

                .pd-main-img-wrap {
                    background: var(--product-bg);
                    aspect-ratio: 1/1;
                    display: flex; align-items: center; justify-content: center;
                    overflow: hidden; position: relative;
                }
                .pd-main-img-wrap img {
                    width: 100%; height: 100%;
                    object-fit: cover;
                    padding: 0;
                    transition: transform .5s cubic-bezier(.16,1,.3,1);
                }
                .pd-main-img-wrap:hover img { transform: scale(1.04); }

                /* discount pill */
                .pd-discount-pill {
                    position: absolute; top: 20px; left: 20px;
                    background: var(--ink); color: #fff;
                    font-family: 'Jost', sans-serif;
                    font-size: 10px; font-weight: 700;
                    letter-spacing: .15em; text-transform: uppercase;
                    padding: 6px 12px;
                    z-index: 2;
                }

                /* wishlist fab */
                .pd-wish-fab {
                    position: absolute; top: 16px; right: 16px;
                    width: 40px; height: 40px; border-radius: 50%;
                    background: var(--white);
                    box-shadow: 0 2px 12px rgba(0,0,0,.1);
                    border: none; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    transition: transform .2s, box-shadow .2s;
                    z-index: 2;
                }
                .pd-wish-fab:hover { transform: scale(1.08); box-shadow: 0 4px 20px rgba(0,0,0,.14); }

                /* thumbnails */
                .pd-thumbs {
                    display: flex; gap: 10px; margin-top: 14px;
                    overflow-x: auto; padding-bottom: 4px;
                }
                .pd-thumbs::-webkit-scrollbar { height: 3px; }
                .pd-thumbs::-webkit-scrollbar-thumb { background: var(--border-md); }
                .pd-thumb {
                    flex-shrink: 0;
                    width: 72px; height: 72px;
                    background: var(--product-bg);
                    border: 1.5px solid transparent;
                    cursor: pointer; overflow: hidden;
                    transition: border-color .2s;
                    display: flex; align-items: center; justify-content: center;
                }
                .pd-thumb img { width:100%; height:100%; object-fit:cover; padding:0; }
                .pd-thumb.active { border-color: var(--ink); }
                .pd-thumb:hover:not(.active) { border-color: var(--border-md); }

                /* ── Info panel ── */
                .pd-info { padding-top: 8px; }

                /* tag row */
                .pd-tags { display:flex; align-items:center; gap:10px; margin-bottom:18px; flex-wrap:wrap; }
                .pd-tag {
                    font-family:'Jost',sans-serif; font-size:10px; font-weight:600;
                    letter-spacing:.18em; text-transform:uppercase; padding:5px 12px;
                }
                .pd-tag-green { background:var(--success); color:#fff; }
                .pd-tag-gold  { background:var(--accent-lt); color:var(--ink); }

                /* product name */
                .pd-name {
                    font-family:'Cormorant Garamond',serif;
                    font-size: clamp(30px, 4vw, 46px);
                    font-weight:500; line-height:1.05;
                    color:var(--ink); margin:0 0 16px;
                    letter-spacing:-.01em;
                }

                /* rating row */
                .pd-rating-row {
                    display:flex; align-items:center; gap:10px; margin-bottom:22px;
                }
                .pd-rating-num {
                    font-family:'Jost',sans-serif; font-size:13px; font-weight:500; color:var(--ink);
                }
                .pd-rating-count {
                    font-family:'Jost',sans-serif; font-size:12px; color:var(--ink-faint);
                    text-decoration:none; border-bottom:1px solid var(--border-md);
                    transition:color .2s;
                }
                .pd-rating-count:hover { color:var(--ink); }

                /* price */
                .pd-price-row { display:flex; align-items:baseline; gap:14px; margin-bottom:26px; }
                .pd-price {
                    font-family:'Cormorant Garamond',serif;
                    font-size:36px; font-weight:600; color:var(--ink); line-height:1;
                }
                .pd-compare {
                    font-family:'Jost',sans-serif; font-size:16px; font-weight:300;
                    color:var(--ink-faint); text-decoration:line-through;
                }
                .pd-save {
                    font-family:'Jost',sans-serif; font-size:11px; font-weight:600;
                    letter-spacing:.1em; text-transform:uppercase;
                    color:var(--success); padding:4px 8px; background:rgba(45,122,79,.09);
                }

                /* description */
                .pd-desc {
                    font-family:'Jost',sans-serif; font-size:14px; font-weight:300;
                    color:var(--ink-soft); line-height:1.75; margin-bottom:32px;
                    padding-bottom:32px; border-bottom:1px solid var(--border);
                }

                /* section label */
                .pd-label {
                    font-family:'Jost',sans-serif; font-size:10px; font-weight:600;
                    letter-spacing:.22em; text-transform:uppercase;
                    color:var(--ink-soft); margin-bottom:12px; display:block;
                }

                /* color swatches */
                .pd-color-row { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:28px; }
                .pd-color-btn {
                    font-family:'Jost',sans-serif; font-size:11px; font-weight:500;
                    letter-spacing:.1em; text-transform:uppercase;
                    padding:9px 18px;
                    background:none; border:1px solid var(--border-md);
                    cursor:pointer; color:var(--ink);
                    transition:border-color .2s, background .2s;
                }
                .pd-color-btn:hover { border-color:var(--ink); }
                .pd-color-btn.active { background:var(--ink); color:#fff; border-color:var(--ink); }

                /* size grid */
                .pd-size-row { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:28px; }
                .pd-size-btn {
                    font-family:'Jost',sans-serif; font-size:12px; font-weight:500;
                    letter-spacing:.08em; text-transform:uppercase;
                    min-width:56px; height:48px; padding:0 14px;
                    background:none; border:1px solid var(--border-md);
                    cursor:pointer; color:var(--ink);
                    display:flex; flex-direction:column;
                    align-items:center; justify-content:center;
                    transition:border-color .2s, background .2s;
                    position:relative;
                }
                .pd-size-btn:hover:not(:disabled) { border-color:var(--ink); }
                .pd-size-btn.active { background:var(--ink); color:#fff; border-color:var(--ink); }
                .pd-size-btn:disabled {
                    opacity:.3; cursor:not-allowed;
                    text-decoration:line-through;
                }
                .pd-size-sub {
                    font-size:9px; font-weight:300; letter-spacing:.04em;
                    margin-top:2px; opacity:.7;
                }
                .pd-size-error {
                    font-family:'Jost',sans-serif; font-size:11px; font-weight:500;
                    letter-spacing:.1em; color:var(--danger);
                    margin-top:-16px; margin-bottom:18px;
                    animation:shakeX .4s ease;
                }
                @keyframes shakeX {
                    0%,100%{transform:translateX(0)}
                    20%,60%{transform:translateX(-6px)}
                    40%,80%{transform:translateX(6px)}
                }

                /* quantity */
                .pd-qty-row { display:flex; align-items:center; gap:0; margin-bottom:28px; width:fit-content; border:1px solid var(--border-md); }
                .pd-qty-btn {
                    width:44px; height:44px; background:none; border:none;
                    cursor:pointer; color:var(--ink);
                    display:flex; align-items:center; justify-content:center;
                    transition:background .18s;
                }
                .pd-qty-btn:hover { background:var(--muted); }
                .pd-qty-val {
                    width:52px; height:44px;
                    font-family:'Jost',sans-serif; font-size:15px; font-weight:500;
                    color:var(--ink); background:var(--warm);
                    display:flex; align-items:center; justify-content:center;
                    border-left:1px solid var(--border-md);
                    border-right:1px solid var(--border-md);
                    user-select:none;
                }

                /* action buttons */
                .pd-actions { display:flex; gap:10px; margin-bottom:28px; flex-wrap:wrap; }

                .pd-btn-cart {
                    flex:1; min-width:140px;
                    font-family:'Jost',sans-serif; font-size:11px; font-weight:700;
                    letter-spacing:.2em; text-transform:uppercase;
                    height:54px; padding:0 24px;
                    background:var(--ink); color:#fff; border:1.5px solid var(--ink);
                    cursor:pointer;
                    display:flex; align-items:center; justify-content:center; gap:10px;
                    transition:background .25s, color .25s;
                }
                .pd-btn-cart:hover:not(:disabled) { background:transparent; color:var(--ink); }
                .pd-btn-cart:disabled { opacity:.45; cursor:not-allowed; }
                .pd-btn-cart.success { background:var(--success); border-color:var(--success); color:#fff; }

                .pd-btn-buy {
                    flex:1; min-width:140px;
                    font-family:'Jost',sans-serif; font-size:11px; font-weight:600;
                    letter-spacing:.18em; text-transform:uppercase;
                    height:54px; padding:0 24px;
                    background:transparent; color:var(--ink); border:1.5px solid var(--border-md);
                    cursor:pointer;
                    display:flex; align-items:center; justify-content:center; gap:10px;
                    transition:border-color .22s, background .22s;
                }
                .pd-btn-buy:hover:not(:disabled) { border-color:var(--ink); background:var(--warm); }
                .pd-btn-buy:disabled { opacity:.4; cursor:not-allowed; }

                /* delivery strip */
                .pd-delivery {
                    display:flex; gap:0; flex-wrap:wrap;
                    border:1px solid var(--border);
                    margin-bottom:28px;
                }
                .pd-del-item {
                    flex:1; min-width:120px;
                    display:flex; align-items:center; gap:12px;
                    padding:16px 18px;
                    font-family:'Jost',sans-serif; font-size:12px; font-weight:400;
                    color:var(--ink-soft);
                    border-right:1px solid var(--border);
                }
                .pd-del-item:last-child { border-right:none; }
                .pd-del-icon { color:var(--accent); flex-shrink:0; }

                /* accordion details */
                .pd-accordion { border-top:1px solid var(--border); }
                .pd-accordion-item { border-bottom:1px solid var(--border); }
                .pd-accordion-btn {
                    width:100%; background:none; border:none; cursor:pointer;
                    padding:18px 0;
                    display:flex; align-items:center; justify-content:space-between;
                    font-family:'Jost',sans-serif; font-size:11px; font-weight:600;
                    letter-spacing:.18em; text-transform:uppercase;
                    color:var(--ink);
                    transition:opacity .2s;
                }
                .pd-accordion-btn:hover { opacity:.6; }
                .pd-accordion-chevron {
                    font-size:10px; transition:transform .28s cubic-bezier(.16,1,.3,1);
                    color:var(--ink-faint); flex-shrink:0;
                }
                .pd-accordion-chevron.open { transform:rotate(90deg); }
                .pd-accordion-body {
                    font-family:'Jost',sans-serif; font-size:13px; font-weight:300;
                    color:var(--ink-soft); line-height:1.75;
                    max-height:0; overflow:hidden;
                    transition:max-height .35s cubic-bezier(.16,1,.3,1), padding .3s;
                    padding:0;
                }
                .pd-accordion-body.open { max-height:300px; padding-bottom:18px; }

                /* ── Responsive ── */
                @media (max-width: 1024px) {
                    .pd-grid { grid-template-columns:1fr; gap:40px; }
                    .pd-gallery { position:static; }
                    .pd-page { padding:28px 24px 80px; }
                }
                @media (max-width: 640px) {
                    .pd-page { padding:20px 16px 80px; }
                    .pd-actions { flex-direction:column; }
                    .pd-btn-cart, .pd-btn-buy { width:100%; }
                }
            `}</style>

            <div className="pd-page">
                {/* Breadcrumb */}
                <nav className="pd-crumb">
                    <Link href="/">Home</Link>
                    <FaChevronLeft className="pd-crumb-sep" style={{ transform:'rotate(180deg)' }} />
                    <Link href="/products">Products</Link>
                    <FaChevronLeft className="pd-crumb-sep" style={{ transform:'rotate(180deg)' }} />
                    <span style={{ color:'var(--ink)' }}>{product.name}</span>
                </nav>

                <div className="pd-grid">
                    {/* ── Left: Gallery ── */}
                    <div className="pd-gallery">
                        <div className="pd-main-img-wrap">
                            {discount && <span className="pd-discount-pill">−{discount}%</span>}

                            <button
                                className="pd-wish-fab"
                                onClick={handleToggleWishlist}
                                aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                            >
                                <FaHeart size={15} style={{ color: isWishlisted ? '#c0392b' : '#ccc', transition:'color .2s' }} />
                            </button>

                            <img src={mainImage} alt={product.name} key={mainImage} />
                        </div>

                        {thumbs.length > 1 && (
                            <div className="pd-thumbs">
                                {thumbs.map((url, idx) => (
                                    <div
                                        key={idx}
                                        className={`pd-thumb${activeThumb === idx ? ' active' : ''}`}
                                        onClick={() => handleThumbClick(url, idx)}
                                    >
                                        <img src={url} alt={`View ${idx + 1}`} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Right: Info ── */}
                    <div className="pd-info">
                        {/* Tags */}
                        <div className="pd-tags">
                            {product.sustainability && (
                                <span className="pd-tag pd-tag-green">
                                    <FaLeaf style={{ marginRight:5, fontSize:9 }} />{product.sustainability}
                                </span>
                            )}
                            {product.stock_quantity > 0 && product.stock_quantity < 10 && (
                                <span className="pd-tag pd-tag-gold">Only {product.stock_quantity} left</span>
                            )}
                        </div>

                        {/* Name */}
                        <h1 className="pd-name">{product.name}</h1>

                        {/* Rating */}
                        <div className="pd-rating-row">
                            {renderStars(product.rating || 0)}
                            <span className="pd-rating-num">{(product.rating || 0).toFixed(1)}</span>
                            <a href="#reviews" className="pd-rating-count">
                                {product.reviewCount || 0} reviews
                            </a>
                        </div>

                        {/* Price */}
                        <div className="pd-price-row">
                            <span className="pd-price">${product.price}</span>
                            {product.compare_price && (
                                <>
                                    <span className="pd-compare">${product.compare_price}</span>
                                    {discount && <span className="pd-save">Save {discount}%</span>}
                                </>
                            )}
                        </div>

                        {/* Description */}
                        <p className="pd-desc">{product.description}</p>

                        {/* Color */}
                        {product.colors?.length > 0 && (
                            <div style={{ marginBottom:28 }}>
                                <span className="pd-label">
                                    Color — <span style={{ color:'var(--ink)', fontWeight:500 }}>{selectedColor?.color_name}</span>
                                </span>
                                <div className="pd-color-row">
                                    {product.colors.map(color => (
                                        <button
                                            key={color.id}
                                            className={`pd-color-btn${selectedColor?.id === color.id ? ' active' : ''}`}
                                            onClick={() => setSelectedColor(color)}
                                        >
                                            {color.color_name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Size */}
                        {availableSizes.length > 0 ? (
                            <div style={{ marginBottom:8 }}>
                                <span className="pd-label">Select Size</span>
                                <div className="pd-size-row">
                                    {availableSizes.map(size => (
                                        <button
                                            key={size.id}
                                            className={`pd-size-btn${selectedSize?.id === size.id ? ' active' : ''}`}
                                            onClick={() => setSelectedSize(size)}
                                            disabled={!size.is_available || size.stock === 0}
                                        >
                                            {size.size_name}
                                            {size.measurements && (
                                                <span className="pd-size-sub">
                                                    {size.measurements.waist  && `W${size.measurements.waist}"`}
                                                    {size.measurements.length && ` L${size.measurements.length}"`}
                                                    {size.measurements.chest  && `C${size.measurements.chest}"`}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                                {sizeError && <p className="pd-size-error">Please select a size to continue</p>}
                            </div>
                        ) : (
                            <p style={{ fontFamily:'Jost,sans-serif', fontSize:13, color:'var(--ink-faint)', marginBottom:24 }}>
                                No sizes available for this colour.
                            </p>
                        )}

                        {/* Quantity */}
                        <span className="pd-label">Quantity</span>
                        <div className="pd-qty-row">
                            <button className="pd-qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))} aria-label="Decrease">
                                <FaMinus size={10} />
                            </button>
                            <span className="pd-qty-val">{quantity}</span>
                            <button className="pd-qty-btn" onClick={() => setQuantity(q => q + 1)} aria-label="Increase">
                                <FaPlus size={10} />
                            </button>
                        </div>

                        {/* Action buttons */}
                        <div className="pd-actions">
                            <button
                                className={`pd-btn-cart${addedToCart ? ' success' : ''}`}
                                onClick={handleAddToCart}
                                disabled={!selectedSize || !selectedSize.is_available || selectedSize.stock === 0}
                            >
                                {addedToCart
                                    ? '✓ Added to Bag'
                                    : !selectedSize
                                        ? 'Select a Size'
                                        : selectedSize.stock === 0
                                            ? 'Out of Stock'
                                            : (<>Add to Bag <FaArrowRight size={10} /></>)
                                }
                            </button>
                            <button
                                className="pd-btn-buy"
                                onClick={handleBuyNow}
                                disabled={!selectedSize || !selectedSize.is_available || selectedSize.stock === 0}
                            >
                                Buy Now
                            </button>
                        </div>

                        {/* Delivery strip */}
                        <div className="pd-delivery">
                            <div className="pd-del-item">
                                <FaTruck className="pd-del-icon" size={14} />
                                <div>
                                    <div style={{ fontFamily:'Jost,sans-serif', fontSize:11, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--ink)', marginBottom:2 }}>Free Shipping</div>
                                    <div style={{ fontSize:11 }}>On orders over $80</div>
                                </div>
                            </div>
                            <div className="pd-del-item">
                                <FaUndo className="pd-del-icon" size={13} />
                                <div>
                                    <div style={{ fontFamily:'Jost,sans-serif', fontSize:11, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--ink)', marginBottom:2 }}>Easy Returns</div>
                                    <div style={{ fontSize:11 }}>30-day hassle-free</div>
                                </div>
                            </div>
                            <div className="pd-del-item">
                                <FaShieldAlt className="pd-del-icon" size={13} />
                                <div>
                                    <div style={{ fontFamily:'Jost,sans-serif', fontSize:11, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--ink)', marginBottom:2 }}>Secure Payment</div>
                                    <div style={{ fontSize:11 }}>SSL encrypted checkout</div>
                                </div>
                            </div>
                        </div>

                        {/* Accordion */}
                        <AccordionSection title="Product Details">
                            <p>Crafted from 100% natural linen. Breathable, lightweight, and made to last. Garment measurements may vary by size — see size guide for exact fit details.</p>
                        </AccordionSection>
                        <AccordionSection title="Care Instructions">
                            <p>Machine wash cold on gentle cycle. Do not tumble dry. Iron on low heat. Dry flat for best results. Natural fabrics may soften with each wash.</p>
                        </AccordionSection>
                        <AccordionSection title="Sustainability">
                            <p>
                                {product.sustainability
                                    ? `${product.sustainability} — We're committed to ethical sourcing and minimal-impact production. Each piece is made with care for people and planet.`
                                    : 'We are committed to ethical sourcing and sustainable manufacturing practices across our entire supply chain.'}
                            </p>
                        </AccordionSection>
                    </div>
                </div>
            </div>
        </>
    );
}

/* ── Accordion sub-component ── */
function AccordionSection({ title, children }: { title: string; children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="pd-accordion-item">
            <button className="pd-accordion-btn" onClick={() => setOpen(o => !o)}>
                {title}
                <FaArrowRight className={`pd-accordion-chevron${open ? ' open' : ''}`} size={10} />
            </button>
            <div className={`pd-accordion-body${open ? ' open' : ''}`}>
                {children}
            </div>
        </div>
    );
}
