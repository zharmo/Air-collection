"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaTruck,
  FaUndo,
  FaHeart,
  FaArrowRight,
  FaShieldAlt,
  FaLeaf,
  FaMinus,
  FaPlus,
  FaChevronLeft,
  FaShareAlt,
} from "react-icons/fa";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import axiosInstance from "@/utils/axiosConfig";

interface ColorVariant {
  id: number;
  color_name: string;
  image_url: string;
}
interface SizeVariant {
  id: number;
  color_id: number | null;
  size_name: string;
  measurements: any;
  stock: number;
  is_available: boolean;
}
interface Product {
  id: number;
  name: string;
  price: number;
  compare_price?: number;
  description: string;
  sustainability?: string;
  rating: number;
  reviewCount: number;
  size_description?: string;
  /* category fields — used for related products fetch */
  category_id?: number;
  category_name?: string;
  images: {
    id: number;
    image_url: string;
    is_primary: boolean;
    color?: string;
  }[];
  colors: ColorVariant[];
  sizes: SizeVariant[];
  stock_quantity: number;
  deliveryBadges?: { text: string }[];
  reviews?: {
    id: number;
    author: string;
    rating: number;
    date: string;
    text: string;
  }[];
  relatedProducts?: {
    id: number;
    name: string;
    price: number;
    image: string;
  }[];
  recommendedProducts?: {
    id: number;
    name: string;
    price: number;
    image: string;
  }[];
}

/* ── Related product shape returned from the list endpoint ── */
interface RelatedProduct {
  id: number;
  name: string;
  price: number | string;
  compare_price?: number | string;
  images?: { image_url: string; is_primary?: boolean }[];
  colors?: { image_url: string }[];
  category_id?: number;
  category_name?: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.productId;
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, wishlist } = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<ColorVariant | null>(null);
  const [selectedSize, setSelectedSize] = useState<SizeVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState("");
  const [activeThumb, setActiveThumb] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  /* ── Related products state ── */
  const [related, setRelated] = useState<RelatedProduct[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
    "http://localhost:5000";

  const getFullImageUrl = (url: string) => {
    if (!url) return "/images/placeholders/placeholder.jpg";
    if (url.startsWith("/uploads")) return `${backendUrl}${url}`;
    return url;
  };

  /* ── Resolve the display image for a related product card ── */
  const getRelatedCardImage = (prod: RelatedProduct): string => {
    if (prod.colors?.length && prod.colors[0].image_url)
      return getFullImageUrl(prod.colors[0].image_url);
    if (prod.images?.length) {
      const primary = prod.images.find((i) => i.is_primary) || prod.images[0];
      return getFullImageUrl(primary.image_url);
    }
    return "/images/placeholders/placeholder.jpg";
  };

  /* ── Fetch main product ── */
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axiosInstance.get(`/products/${productId}`);
        const prod = res.data.data;
        setProduct(prod);
        if (prod.colors?.length) {
          setSelectedColor(prod.colors[0]);
          setMainImage(getFullImageUrl(prod.colors[0].image_url));
        } else if (prod.images?.length) {
          const primary =
            prod.images.find((img: any) => img.is_primary) || prod.images[0];
          setMainImage(getFullImageUrl(primary.image_url));
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    if (productId) fetchProduct();
  }, [productId]);

  /* ── Fetch related products once the main product is loaded ──
   *
   * Strategy:
   *   1. Try  GET /products?category_id=<id>&limit=9
   *   2. Fall back to GET /products?limit=9  (no category filter)
   *   3. Shuffle the results, exclude the current product, keep up to 4.
   *
   * This is fire-and-forget — any failure is silently swallowed so
   * it never impacts the main product experience.
   * ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!product) return;

    const fetchRelated = async () => {
      setRelatedLoading(true);
      try {
        let data: RelatedProduct[] = [];

        if (product.category_id) {
          /* Preferred: filter by same category */
          const res = await axiosInstance.get(
            `/products?category_id=${product.category_id}&limit=9`,
          );
          data = res.data.data || res.data || [];
        }

        /* If category filter returned nothing, fall back to all products */
        if (data.length === 0) {
          const res = await axiosInstance.get("/products?limit=12");
          data = res.data.data || res.data || [];
        }

        /* Remove current product, shuffle, keep up to 4 */
        const filtered = data.filter(
          (p: RelatedProduct) => Number(p.id) !== Number(productId),
        );
        const shuffled = filtered.sort(() => Math.random() - 0.5).slice(0, 4);
        setRelated(shuffled);
      } catch {
        /* Silently ignore — related products are non-critical */
        setRelated([]);
      } finally {
        setRelatedLoading(false);
      }
    };

    fetchRelated();
  }, [product, productId]);

  useEffect(() => {
    if (product && wishlist?.items)
      setIsWishlisted(
        wishlist.items.some((item: any) => item.product_id === product.id),
      );
  }, [wishlist, product]);

  useEffect(() => {
    if (selectedColor) {
      setMainImage(getFullImageUrl(selectedColor.image_url));
      setSelectedSize(null);
      setActiveThumb(0);
    }
  }, [selectedColor]);

  const filteredSizes = () => {
    if (!product) return [];
    if (!selectedColor) return product.sizes.filter((s) => s.color_id === null);
    return product.sizes.filter(
      (s) => s.color_id === null || s.color_id === selectedColor.id,
    );
  };

  const getCurrentStock = () => {
    if (!product) return 0;

    const productStock = Number(product.stock_quantity) || 0;
    if (productStock <= 0) return 0;

    const sizeOptions = filteredSizes();
    if (sizeOptions.length === 0) return productStock;
    if (selectedSize) return Math.min(productStock, Number(selectedSize.stock) || 0);

    const maxSizeStock = Math.max(
      0,
      ...sizeOptions
        .filter((size) => size.is_available && Number(size.stock) > 0)
        .map((size) => Number(size.stock) || 0),
    );

    return Math.min(productStock, maxSizeStock);
  };

  useEffect(() => {
    if (!product) return;

    const currentStock = getCurrentStock();
    setQuantity((current) =>
      currentStock > 0 ? Math.min(current, currentStock) : 1,
    );
  }, [product, selectedColor, selectedSize]);

  const allThumbs = () => {
    if (!product) return [];
    const imgs: string[] = [];
    if (selectedColor?.image_url)
      imgs.push(getFullImageUrl(selectedColor.image_url));
    product.images.forEach((img) => {
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
    const sizeOptions = filteredSizes();
    const needsSize = sizeOptions.length > 0;
    const sizeUnavailable =
      needsSize && (!selectedSize?.is_available || selectedSize.stock === 0);
    const currentStock = getCurrentStock();
    const productUnavailable = currentStock <= 0 || quantity > currentStock;

    if (needsSize && !selectedSize) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 2000);
      return false;
    }

    if (sizeUnavailable || productUnavailable) return false;

    let imageUrl = "";
    if (selectedColor?.image_url)
      imageUrl = getFullImageUrl(selectedColor.image_url);
    else if (product?.images?.length) {
      const primary =
        product.images.find((img) => img.is_primary) || product.images[0];
      imageUrl = getFullImageUrl(primary.image_url);
    }
    const numericPrice = Number(product!.price);
    await addToCart(product!.id, quantity, {
      size: selectedSize?.size_name,
      color: selectedColor?.color_name,
      name: product!.name,
      price: numericPrice,
      image: imageUrl,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
    return true;
  };

  const handleBuyNow = async () => {
    const added = await handleAddToCart();
    if (added) window.location.href = "/cart";
  };

  const handleToggleWishlist = () => {
    if (isWishlisted) removeFromWishlist(product!.id);
    else addToWishlist(product!.id);
  };

  /* ── Share Product — native share sheet, falls back to copy-link ── */
  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({ title: product?.name, url });
        return;
      }
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch {
      /* user cancelled the share sheet — ignore */
    }
  };

  const renderStars = (rating: number) => {
    const full = Math.floor(rating),
      half = rating % 1 !== 0,
      empty = 5 - full - (half ? 1 : 0);
    return (
      <span style={{ display: "inline-flex", gap: 2 }}>
        {[...Array(full)].map((_, i) => (
          <FaStar key={i} style={{ color: "#c8a96a" }} />
        ))}
        {half && <FaStarHalfAlt style={{ color: "#c8a96a" }} />}
        {[...Array(empty)].map((_, i) => (
          <FaRegStar key={i} style={{ color: "#c8a96a" }} />
        ))}
      </span>
    );
  };

  const formatPrice = (value: number) => Number(value).toFixed(2);

  const thumbs = allThumbs();
  const discount = product?.compare_price
    ? Math.round(
        ((product.compare_price - product.price) / product.compare_price) * 100,
      )
    : null;

  /* ─── Loading ─── */
  if (loading)
    return (
      <div
        style={{
          minHeight: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 36,
              height: 36,
              border: "1.5px solid #eee",
              borderTopColor: "#111111",
              borderRadius: "50%",
              animation: "spin .8s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p
            style={{
              fontFamily: "Jost,sans-serif",
              fontSize: 11,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#aaa",
            }}
          >
            Loading
          </p>
        </div>
      </div>
    );

  /* ─── Error ─── */
  if (error || !product)
    return (
      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
        }}
      >
        <p
          style={{
            fontFamily: "Cormorant Garamond,serif",
            fontSize: 28,
            color: "#111111",
          }}
        >
          Product not found
        </p>
        <Link
          href="/"
          style={{
            fontFamily: "Jost,sans-serif",
            fontSize: 11,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#111111",
            textDecoration: "none",
            borderBottom: "1px solid #111111",
            paddingBottom: 2,
          }}
        >
          ← Back to Home
        </Link>
      </div>
    );

  const availableSizes = filteredSizes();
  const hasSizeOptions = availableSizes.length > 0;
  const productStock = Number(product.stock_quantity) || 0;
  const hasAvailableSize = availableSizes.some(
    (size) => size.is_available && Number(size.stock) > 0,
  );
  const currentStock = getCurrentStock();
  const selectedSizeUnavailable =
    hasSizeOptions &&
    !!selectedSize &&
    (!selectedSize.is_available || selectedSize.stock === 0);
  const isOutOfStock =
    productStock <= 0 ||
    (hasSizeOptions ? !hasAvailableSize || selectedSizeUnavailable : false);
  const isActionDisabled =
    addedToCart ||
    isOutOfStock;

  return (
    <>
      <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Jost:wght@300;400;500;600&display=swap');

                *, *::before, *::after { box-sizing: border-box; }

                :root {
                    --ink:        #111111;
                    --ink-soft:   #5c5c5c;
                    --ink-faint:  #aaa;
                    --white:      #ffffff;
                    --warm:       #F7F7F7;
                    --muted:      #f0efec;
                    --product-bg: #f7f6f3;
                    --accent:     #c8a96a;
                    --accent-lt:  #f0e8d8;
                    --success:    #2d7a4f;
                    --danger:     #c0392b;
                    --border:     rgba(0,0,0,0.08);
                    --border-md:  rgba(0,0,0,0.13);
                    --radius:     16px;
                    --radius-sm:  10px;
                    --shadow-sm:  0 2px 16px rgba(0,0,0,0.06);
                    --shadow-md:  0 8px 32px rgba(0,0,0,0.08);
                    --shadow-lg:  0 20px 56px rgba(0,0,0,0.14);
                    --glass-bg:     rgba(255,255,255,0.6);
                    --glass-border: rgba(255,255,255,0.65);
                }

                .pd-page {
                    max-width: 1360px;
                    margin: 0 auto;
                    padding: 40px 40px 100px;
                    background: var(--white);
                }

                .pd-crumb {
                    display: flex; align-items: center; gap: 10px;
                    margin-bottom: 36px;
                    font-family: 'Jost', sans-serif;
                    font-size: 11px; font-weight: 400;
                    letter-spacing: 0.12em; text-transform: uppercase;
                    color: var(--ink-faint);
                }
                .pd-crumb a { color: var(--ink-faint); text-decoration: none; transition: color .2s; }
                .pd-crumb a:hover { color: var(--ink); }
                .pd-crumb-sep { font-size: 9px; opacity: .4; }
                .pd-crumb-current { color: var(--ink); }

                .pd-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 64px;
                    align-items: start;
                }

                .pd-gallery { position: sticky; top: 90px; }

                .pd-main-img-wrap {
                    background: var(--product-bg);
                    aspect-ratio: 1/1;
                    display: flex; align-items: center; justify-content: center;
                    overflow: hidden; position: relative;
                    border-radius: var(--radius);
                    box-shadow: var(--shadow-sm);
                }
                .pd-main-img-wrap img {
                    width: 100%; height: 100%;
                    /* contain (not cover) so every uploaded image shows in
                       full, regardless of its original aspect ratio — cover
                       was cropping/zooming into non-square photos. A blurred
                       backdrop layer was tried here too, but it smears badly
                       on photos with hard edges (skin, mannequin parts) near
                       the border, so a plain neutral box is the safer,
                       more professional default. See note below the code
                       for the real fix to backdrop-color mismatches. */
                    object-fit: contain; padding: 0;
                    transition: transform .5s cubic-bezier(.16,1,.3,1);
                }
                .pd-main-img-wrap:hover img { transform: scale(1.04); }

                .pd-discount-pill {
                    position: absolute; top: 20px; left: 20px;
                    background: var(--ink); color: #fff;
                    font-family: 'Jost', sans-serif;
                    font-size: 10px; font-weight: 700;
                    letter-spacing: .15em; text-transform: uppercase;
                    padding: 7px 14px; border-radius: 100px; z-index: 2;
                }
                .pd-stock-pill {
                    position: absolute; top: 20px; left: 20px;
                    background: var(--danger); color: #fff;
                    font-family: 'Jost', sans-serif;
                    font-size: 10px; font-weight: 700;
                    letter-spacing: .15em; text-transform: uppercase;
                    padding: 7px 14px; border-radius: 100px; z-index: 2;
                }

                .pd-wish-fab {
                    position: absolute; top: 16px; right: 16px;
                    width: 42px; height: 42px; border-radius: 50%;
                    background: var(--glass-bg);
                    border: 1px solid var(--glass-border);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    box-shadow: 0 4px 18px rgba(0,0,0,.1);
                    cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    transition: transform .2s, box-shadow .2s; z-index: 2;
                }
                .pd-wish-fab:hover { transform: scale(1.08); box-shadow: 0 6px 22px rgba(0,0,0,.14); }

                .pd-thumbs {
                    display: flex; gap: 10px; margin-top: 14px;
                    overflow-x: auto; padding-bottom: 4px;
                }
                .pd-thumbs::-webkit-scrollbar { height: 3px; }
                .pd-thumbs::-webkit-scrollbar-thumb { background: var(--border-md); }
                .pd-thumb {
                    flex-shrink: 0; width: 76px; height: 76px;
                    background: var(--product-bg);
                    border: 1.5px solid transparent;
                    border-radius: var(--radius-sm);
                    cursor: pointer; overflow: hidden; transition: border-color .2s, transform .2s;
                    display: flex; align-items: center; justify-content: center;
                }
                .pd-thumb img { width:100%; height:100%; object-fit:contain; padding:0; }
                .pd-thumb.active { border-color: var(--ink); }
                .pd-thumb:hover:not(.active) { border-color: var(--border-md); transform: translateY(-2px); }

                .pd-info { padding-top: 8px; }

                .pd-tags { display:flex; align-items:center; gap:10px; margin-bottom:18px; flex-wrap:wrap; }
                .pd-tag { font-family:'Jost',sans-serif; font-size:10px; font-weight:600; letter-spacing:.18em; text-transform:uppercase; padding:6px 13px; border-radius:100px; }
                .pd-tag-green { background:var(--success); color:#fff; }
                .pd-tag-gold  { background:var(--accent-lt); color:var(--ink); }

                .pd-name {
                    font-family:'Cormorant Garamond',serif;
                    font-size: clamp(30px, 4vw, 46px);
                    font-weight:500; line-height:1.05;
                    color:var(--ink); margin:0 0 16px; letter-spacing:-.01em;
                }

                .pd-rating-row { display:flex; align-items:center; gap:10px; margin-bottom:22px; }
                .pd-rating-num { font-family:'Jost',sans-serif; font-size:13px; font-weight:500; color:var(--ink); }
                .pd-rating-count { font-family:'Jost',sans-serif; font-size:12px; color:var(--ink-faint); text-decoration:none; border-bottom:1px solid var(--border-md); transition:color .2s; }
                .pd-rating-count:hover { color:var(--ink); }

                .pd-price-row { display:flex; align-items:baseline; gap:14px; margin-bottom:26px; }
                .pd-price { font-family:'Cormorant Garamond',serif; font-size:36px; font-weight:600; color:var(--ink); line-height:1; }
                .pd-compare { font-family:'Jost',sans-serif; font-size:16px; font-weight:300; color:var(--ink-faint); text-decoration:line-through; }
                .pd-save { font-family:'Jost',sans-serif; font-size:11px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; color:var(--success); padding:4px 10px; border-radius:100px; background:rgba(45,122,79,.09); }

                .pd-desc { font-family:'Jost',sans-serif; font-size:14px; font-weight:300; color:var(--ink-soft); line-height:1.75; margin-bottom:32px; padding-bottom:32px; border-bottom:1px solid var(--border); }

                .pd-label { font-family:'Jost',sans-serif; font-size:10px; font-weight:600; letter-spacing:.22em; text-transform:uppercase; color:var(--ink-soft); margin-bottom:14px; display:block; }

                /* ── Color swatches — circular, real product image, animated ring ── */
                .pd-color-row { display:flex; gap:14px; flex-wrap:wrap; margin-bottom:28px; }
                .pd-color-swatch {
                    position: relative;
                    width: 42px; height: 42px;
                    border-radius: 50%;
                    padding: 0;
                    border: 2px solid var(--white);
                    box-shadow: 0 0 0 1px var(--border-md);
                    cursor: pointer;
                    overflow: hidden;
                    background: var(--muted);
                    transition: transform .2s cubic-bezier(.16,1,.3,1);
                }
                .pd-color-swatch img { width:100%; height:100%; object-fit:cover; display:block; }
                .pd-color-swatch:hover { transform: scale(1.08); }
                .pd-color-swatch.active { box-shadow: 0 0 0 1px var(--ink); }
                .pd-color-swatch.active::after {
                    content: '';
                    position: absolute;
                    inset: -5px;
                    border-radius: 50%;
                    border: 1.5px solid var(--accent);
                    animation: pd-ring-pop .3s cubic-bezier(.16,1,.3,1);
                }
                @keyframes pd-ring-pop {
                    from { transform: scale(.72); opacity: 0; }
                    to   { transform: scale(1);   opacity: 1; }
                }

                .pd-size-head-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
                .pd-size-head-row .pd-label { margin-bottom:0; }

                .pd-size-row { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px; }
                .pd-size-btn { font-family:'Jost',sans-serif; font-size:12px; font-weight:500; letter-spacing:.08em; text-transform:uppercase; min-width:56px; height:48px; padding:0 14px; background:none; border:1px solid var(--border-md); border-radius:var(--radius-sm); cursor:pointer; color:var(--ink); display:flex; flex-direction:column; align-items:center; justify-content:center; transition:border-color .2s, background .2s, transform .15s; position:relative; }
                .pd-size-btn:hover:not(:disabled) { border-color:var(--ink); transform: translateY(-1px); }
                .pd-size-btn.active { background:var(--ink); color:#fff; border-color:var(--ink); }
                .pd-size-btn:disabled { opacity:.3; cursor:not-allowed; text-decoration:line-through; }
                .pd-size-sub { font-size:9px; font-weight:300; letter-spacing:.04em; margin-top:2px; opacity:.7; }

                .pd-size-error { font-family:'Jost',sans-serif; font-size:11px; font-weight:500; letter-spacing:.1em; color:var(--danger); margin-top:-8px; margin-bottom:18px; animation:shakeX .4s ease; }
                @keyframes shakeX { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }

                /* ── Size Guide Panel ── */
                .pd-size-guide { margin-top:12px; margin-bottom:28px; border:1px solid var(--border); border-radius:var(--radius-sm); overflow:hidden; }
                .pd-size-guide-btn {
                    width:100%; background:var(--warm); border:none; cursor:pointer;
                    padding:12px 16px;
                    display:flex; align-items:center; justify-content:space-between;
                    transition:background .18s;
                }
                .pd-size-guide-btn:hover { background:var(--muted); }
                .pd-size-guide-label {
                    display:flex; align-items:center; gap:8px;
                    font-family:'Jost',sans-serif; font-size:10px; font-weight:600;
                    letter-spacing:.2em; text-transform:uppercase; color:var(--ink-soft);
                }
                .pd-size-guide-chevron { transition:transform .28s cubic-bezier(.16,1,.3,1); color:var(--ink-faint); flex-shrink:0; }
                .pd-size-guide-chevron.open { transform:rotate(180deg); }
                .pd-size-guide-body {
                    max-height:0; overflow:hidden;
                    transition:max-height .38s cubic-bezier(.16,1,.3,1);
                    background:var(--warm);
                    border-top:0px solid var(--border);
                }
                .pd-size-guide-body.open {
                    max-height:400px;
                    border-top:1px solid var(--border);
                }
                .pd-size-guide-content {
                    padding:16px 18px 20px;
                    font-family:'Jost',sans-serif; font-size:13px; font-weight:300;
                    color:var(--ink-soft); line-height:1.85;
                    white-space:pre-wrap; word-break:break-word;
                }

                .pd-qty-row { display:flex; align-items:center; gap:0; margin-bottom:28px; width:fit-content; border:1px solid var(--border-md); border-radius:var(--radius-sm); overflow:hidden; }
                .pd-qty-btn { width:44px; height:44px; background:none; border:none; cursor:pointer; color:var(--ink); display:flex; align-items:center; justify-content:center; transition:background .18s; }
                .pd-qty-btn:hover { background:var(--muted); }
                .pd-qty-btn:disabled { opacity:.35; cursor:not-allowed; }
                .pd-qty-btn:disabled:hover { background:transparent; }
                .pd-qty-val { width:52px; height:44px; font-family:'Jost',sans-serif; font-size:15px; font-weight:500; color:var(--ink); background:var(--warm); display:flex; align-items:center; justify-content:center; border-left:1px solid var(--border-md); border-right:1px solid var(--border-md); user-select:none; }

                /* ── Actions: gold Add to Cart + inline wishlist, then full-width black Buy Now ── */
                .pd-actions-row { display:flex; gap:10px; margin-bottom:12px; }
                .pd-btn-cart {
                    flex:1; min-width:140px;
                    font-family:'Jost',sans-serif; font-size:11px; font-weight:700; letter-spacing:.2em; text-transform:uppercase;
                    min-height:54px; padding:14px 24px;
                    background:var(--accent); color:var(--ink);
                    border:1.5px solid var(--accent);
                    border-radius:var(--radius-sm);
                    cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px; line-height:1.2;
                    transition:background .25s, transform .2s, box-shadow .25s;
                }
                .pd-btn-cart:hover:not(:disabled) { background:#dabb84; transform: translateY(-2px); box-shadow: 0 12px 28px rgba(200,169,106,.35); }
                .pd-btn-cart:disabled { opacity:.45; cursor:not-allowed; }
                .pd-btn-cart.success { background:var(--success); border-color:var(--success); color:#fff; }

                .pd-btn-wish-inline {
                    width:54px; height:54px; flex-shrink:0;
                    background:var(--white); border:1.5px solid var(--border-md); border-radius:var(--radius-sm);
                    cursor:pointer; display:flex; align-items:center; justify-content:center;
                    transition:border-color .2s, transform .2s;
                }
                .pd-btn-wish-inline:hover { border-color:var(--ink); transform: translateY(-2px); }

                .pd-btn-buy {
                    width:100%;
                    font-family:'Jost',sans-serif; font-size:11px; font-weight:600; letter-spacing:.18em; text-transform:uppercase;
                    min-height:54px; padding:14px 24px;
                    background:var(--ink); color:#fff;
                    border:1.5px solid var(--ink);
                    border-radius:var(--radius-sm);
                    cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px; line-height:1.2;
                    transition:background .22s, transform .2s;
                    margin-bottom: 14px;
                }
                .pd-btn-buy:hover:not(:disabled) { background:#2a2a2a; transform: translateY(-2px); }
                .pd-btn-buy:disabled { opacity:.4; cursor:not-allowed; }

                .pd-btn-share {
                    display:inline-flex; align-items:center; gap:8px;
                    font-family:'Jost',sans-serif; font-size:10px; font-weight:600; letter-spacing:.16em; text-transform:uppercase;
                    color:var(--ink-soft); background:none; border:none; cursor:pointer;
                    padding:4px 0; margin-bottom:28px;
                    transition:color .2s;
                }
                .pd-btn-share:hover { color:var(--ink); }
                .pd-share-copied { color:var(--success); }

                /* ── Delivery strip — glass cards ── */
                .pd-delivery { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:28px; }
                .pd-del-item {
                    flex:1; min-width:150px; display:flex; align-items:center; gap:12px;
                    padding:16px 18px;
                    background: var(--glass-bg);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-sm);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    box-shadow: var(--shadow-sm);
                    font-family:'Jost',sans-serif; font-size:12px; font-weight:400; color:var(--ink-soft);
                }
                .pd-del-icon-wrap {
                    width:34px; height:34px; border-radius:50%;
                    background: var(--accent-lt);
                    display:flex; align-items:center; justify-content:center;
                    flex-shrink:0;
                }
                .pd-del-icon { color:var(--ink); flex-shrink:0; }

                .pd-accordion { border-top:1px solid var(--border); }
                .pd-accordion-item { border-bottom:1px solid var(--border); }
                .pd-accordion-btn { width:100%; background:none; border:none; cursor:pointer; padding:18px 0; display:flex; align-items:center; justify-content:space-between; font-family:'Jost',sans-serif; font-size:11px; font-weight:600; letter-spacing:.18em; text-transform:uppercase; color:var(--ink); transition:opacity .2s; }
                .pd-accordion-btn:hover { opacity:.6; }
                .pd-accordion-chevron { font-size:10px; transition:transform .28s cubic-bezier(.16,1,.3,1); color:var(--ink-faint); flex-shrink:0; }
                .pd-accordion-chevron.open { transform:rotate(90deg); }
                .pd-accordion-body { font-family:'Jost',sans-serif; font-size:13px; font-weight:300; color:var(--ink-soft); line-height:1.75; max-height:0; overflow:hidden; transition:max-height .35s cubic-bezier(.16,1,.3,1), padding .3s; padding:0; }
                .pd-accordion-body.open { max-height:300px; padding-bottom:18px; }

                /* ══════════════════════════════════════════
                   RELATED PRODUCTS SECTION
                ══════════════════════════════════════════ */
                .pd-related {
                    margin-top: 80px;
                    padding-top: 52px;
                    border-top: 1px solid var(--border);
                }

                /* Section header — eyebrow + heading + rule */
                .pd-related-header {
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-between;
                    gap: 24px;
                    margin-bottom: 40px;
                    flex-wrap: wrap;
                }
                .pd-related-heading-group { display: flex; flex-direction: column; gap: 6px; }
                .pd-related-eyebrow {
                    font-family: 'Jost', sans-serif;
                    font-size: 10px; font-weight: 600;
                    letter-spacing: 0.26em; text-transform: uppercase;
                    color: var(--accent);
                }
                .pd-related-title {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: clamp(24px, 3vw, 34px);
                    font-weight: 500; line-height: 1.05;
                    color: var(--ink); margin: 0;
                    letter-spacing: -0.01em;
                }
                .pd-related-view-all {
                    font-family: 'Jost', sans-serif;
                    font-size: 10px; font-weight: 600;
                    letter-spacing: 0.22em; text-transform: uppercase;
                    color: var(--ink); text-decoration: none;
                    border-bottom: 1px solid var(--border-md);
                    padding-bottom: 2px;
                    white-space: nowrap;
                    transition: border-color 0.2s, color 0.2s;
                    display: flex; align-items: center; gap: 7px;
                    margin-bottom: 4px;
                }
                .pd-related-view-all:hover { border-color: var(--ink); color: var(--ink); }

                /* Responsive 4-column grid */
                .pd-related-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 20px;
                }

                /* ── Individual card ── */
                .pd-rel-card {
                    display: flex;
                    flex-direction: column;
                    text-decoration: none;
                    border-radius: var(--radius-sm);
                    overflow: hidden;
                    /* hardware-accelerate hover transform */
                    will-change: transform;
                    transition: box-shadow .35s cubic-bezier(.16,1,.3,1), transform .35s cubic-bezier(.16,1,.3,1);
                }
                .pd-rel-card:hover {
                    box-shadow: var(--shadow-lg);              
                    transform: translateY(-3px); 
                }

                /* Image container — square, same warm bg as main gallery */
                .pd-rel-img-wrap {
                    width: 100%;
                    aspect-ratio: 6/7;
                    background: var(--product-bg);
                    overflow: hidden;
                    position: relative;
                }
                .pd-rel-img-wrap img {
                    width: 100%; height: 100%;
                    object-fit: cover; padding: 0;
                    transition: transform .55s cubic-bezier(.16,1,.3,1);
                }
                .pd-rel-card:hover .pd-rel-img-wrap img { transform: scale(1.06);  }

                /* Quick-shop overlay — fades in on hover */
                .pd-rel-overlay {
                    position: absolute; inset: 0;
                    background: rgba(10,10,10,0);
                    display: flex; align-items: flex-end;
                    transition: background 0.28s;
                    pointer-events: none;
                }
                .pd-rel-overlay-label {
                    width: 100%;
                    font-family: 'Jost', sans-serif;
                    font-size: 10px; font-weight: 600;
                    letter-spacing: 0.22em; text-transform: uppercase;
                    color: #fff;
                    background: var(--ink);
                    padding: 18px 10px;
                    opacity: 0;
                    transform: translateY(6px);
                    transition: opacity 0.26s, transform 0.26s cubic-bezier(.16,1,.3,1);
                    text-align: center;
                }
                .pd-rel-card:hover .pd-rel-overlay-label {
                    opacity: 1;
                    transform: translateY(0);
                }

                /* Text block below image */
                .pd-rel-info {
                    padding: 14px 6px 10px;
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }
                .pd-rel-name {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 17px; font-weight: 500;
                    color: var(--ink); line-height: 1.25;
                    letter-spacing: -0.01em;
                    /* clamp to 2 lines */
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .pd-rel-price-row {
                    display: flex; align-items: baseline; gap: 8px;
                }
                .pd-rel-price {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 20px; font-weight: 600; color: var(--ink);
                }
                .pd-rel-compare {
                    font-family: 'Jost', sans-serif;
                    font-size: 12px; font-weight: 300;
                    color: var(--ink-faint);
                    text-decoration: line-through;
                }

                /* Loading skeleton cards */
                .pd-rel-skeleton {
                    display: flex; flex-direction: column; gap: 12px;
                }
                .pd-rel-skel-img {
                    width: 100%; aspect-ratio: 3/4;
                    border-radius: var(--radius-sm);
                    background: linear-gradient(90deg, var(--muted) 25%, var(--product-bg) 50%, var(--muted) 75%);
                    background-size: 200% 100%;
                    animation: pd-shimmer 1.4s infinite;
                }
                .pd-rel-skel-line {
                    height: 14px; border-radius: 2px;
                    background: linear-gradient(90deg, var(--muted) 25%, var(--product-bg) 50%, var(--muted) 75%);
                    background-size: 200% 100%;
                    animation: pd-shimmer 1.4s infinite;
                }
                .pd-rel-skel-line-sm { height: 11px; width: 55%; }
                @keyframes pd-shimmer {
                    0%   { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }

                @media (max-width: 1024px) {
                    .pd-grid { grid-template-columns:1fr; gap:40px; }
                    .pd-gallery { position:static; }
                    .pd-page { padding:28px 24px 80px; }
                    .pd-related-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; }
                }
                @media (max-width: 768px) {
                    .pd-related-grid { grid-template-columns: repeat(2, 1fr); gap: 14px; }
                    .pd-related { margin-top: 56px; padding-top: 40px; }
                }
                @media (max-width: 640px) {
                    .pd-page { padding:20px 16px 80px; }
                    .pd-actions-row { flex-direction:row; }
                    .pd-btn-cart, .pd-btn-buy { width:100%; min-height:56px; padding:16px 18px; }
                    .pd-delivery { flex-direction: column; }
                    .pd-del-item { min-width:0; }
                    /* Stack related grid to 2 cols on small screens */
                    .pd-related-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
                    .pd-related-header { gap: 14px; }
                    .pd-related-view-all { font-size: 9px; }
                }
            `}</style>

      <div className="pd-page">
        {/* Breadcrumb */}
        <nav className="pd-crumb">
          <Link href="/">Home</Link>
          <FaChevronLeft
            className="pd-crumb-sep"
            style={{ transform: "rotate(180deg)" }}
          />
          <Link href="/products">Products</Link>
          {product.category_name && (
            <>
              <FaChevronLeft
                className="pd-crumb-sep"
                style={{ transform: "rotate(180deg)" }}
              />
              <span>{product.category_name}</span>
            </>
          )}
          <FaChevronLeft
            className="pd-crumb-sep"
            style={{ transform: "rotate(180deg)" }}
          />
          <span className="pd-crumb-current">{product.name}</span>
        </nav>

        <div className="pd-grid">
          {/* ── Left: Gallery ── */}
          <div className="pd-gallery">
            <div className="pd-main-img-wrap">
              {isOutOfStock ? (
                <span className="pd-stock-pill">Stock Out</span>
              ) : discount && (
                <span className="pd-discount-pill">−{discount}%</span>
              )}
              <button
                className="pd-wish-fab"
                onClick={handleToggleWishlist}
                aria-label={
                  isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                }
              >
                <FaHeart
                  size={15}
                  style={{
                    color: isWishlisted ? "#c0392b" : "#ccc",
                    transition: "color .2s",
                  }}
                />
              </button>
              <img
                src={mainImage}
                alt={product.name}
                key={mainImage}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "/images/placeholders/placeholder.jpg";
                }}
              />
            </div>
            {thumbs.length > 1 && (
              <div className="pd-thumbs">
                {thumbs.map((url, idx) => (
                  <div
                    key={idx}
                    className={`pd-thumb${activeThumb === idx ? " active" : ""}`}
                    onClick={() => handleThumbClick(url, idx)}
                  >
                    <img
                      src={url}
                      alt={`View ${idx + 1}`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/images/placeholders/placeholder.jpg";
                      }}
                    />
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
                  <FaLeaf style={{ marginRight: 5, fontSize: 9 }} />
                  {product.sustainability}
                </span>
              )}
              {product.stock_quantity > 0 && product.stock_quantity < 10 && (
                <span className="pd-tag pd-tag-gold">
                  Only {product.stock_quantity} left
                </span>
              )}
            </div>

            {/* Name */}
            <h1 className="pd-name">{product.name}</h1>

            {/* Rating */}
            <div className="pd-rating-row">
              {renderStars(product.rating || 0)}
              <span className="pd-rating-num">
                {(product.rating || 0).toFixed(1)}
              </span>
              <a href="#reviews" className="pd-rating-count">
                {product.reviewCount || 0} reviews
              </a>
            </div>

            {/* Price */}
            <div className="pd-price-row">
              <span className="pd-price">${formatPrice(product.price)}</span>
              {product.compare_price && (
                <>
                  <span className="pd-compare">
                    ${formatPrice(product.compare_price)}
                  </span>
                  {discount && (
                    <span className="pd-save">Save {discount}%</span>
                  )}
                </>
              )}
            </div>

            {/* Description */}
            <p className="pd-desc">{product.description}</p>

            {/* Color — circular swatches using each variant's real image */}
            {product.colors?.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <span className="pd-label">
                  Color —{" "}
                  <span style={{ color: "var(--ink)", fontWeight: 500 }}>
                    {selectedColor?.color_name}
                  </span>
                </span>
                <div className="pd-color-row">
                  {product.colors.map((color) => (
                    <button
                      key={color.id}
                      className={`pd-color-swatch${selectedColor?.id === color.id ? " active" : ""}`}
                      onClick={() => setSelectedColor(color)}
                      aria-label={color.color_name}
                      title={color.color_name}
                    >
                      <img
                        src={getFullImageUrl(color.image_url)}
                        alt={color.color_name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/images/placeholders/placeholder.jpg";
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size */}
            {availableSizes.length > 0 ? (
              <div style={{ marginBottom: 8 }}>
                <div className="pd-size-head-row">
                  <span className="pd-label">Select Size</span>
                </div>
                <div className="pd-size-row">
                  {availableSizes.map((size) => (
                    <button
                      key={size.id}
                      className={`pd-size-btn${selectedSize?.id === size.id ? " active" : ""}`}
                      onClick={() => setSelectedSize(size)}
                      disabled={!size.is_available || size.stock === 0}
                    >
                      {size.size_name}
                      {size.measurements && (
                        <span className="pd-size-sub">
                          {size.measurements.waist &&
                            `W${size.measurements.waist}"`}
                          {size.measurements.length &&
                            ` L${size.measurements.length}"`}
                          {size.measurements.chest &&
                            `C${size.measurements.chest}"`}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {sizeError && (
                  <p className="pd-size-error">
                    Please select a size to continue
                  </p>
                )}

                {/* ── Size Guide Panel ── */}
                {product.size_description && (
                  <SizeGuidePanel description={product.size_description} />
                )}
              </div>
            ) : (
              <p
                style={{
                  fontFamily: "Jost,sans-serif",
                  fontSize: 13,
                  color: "var(--ink-faint)",
                  marginBottom: 24,
                }}
              >
                {product.sizes?.length
                  ? "No sizes available for this colour."
                  : "No size selection required."}
              </p>
            )}

            {/* Quantity */}
            <span className="pd-label">Quantity</span>
            <div className="pd-qty-row">
              <button
                className="pd-qty-btn"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1 || currentStock <= 0}
                aria-label="Decrease"
              >
                <FaMinus size={10} />
              </button>
              <span className="pd-qty-val">{quantity}</span>
              <button
                className="pd-qty-btn"
                onClick={() =>
                  setQuantity((q) =>
                    currentStock > 0 ? Math.min(currentStock, q + 1) : 1,
                  )
                }
                disabled={currentStock <= 0 || quantity >= currentStock}
                aria-label="Increase"
              >
                <FaPlus size={10} />
              </button>
            </div>

            {/* Action buttons */}
            <div className="pd-actions-row">
              <button
                className={`pd-btn-cart${addedToCart ? " success" : ""}`}
                onClick={handleAddToCart}
                disabled={isActionDisabled}
              >
                {addedToCart ? (
                  "✓ Added to Cart"
                ) : isOutOfStock ? (
                  "Out of Stock"
                ) : hasSizeOptions && !selectedSize ? (
                  "Select a Size"
                ) : (
                  <>
                    Add to Cart <FaArrowRight size={10} />
                  </>
                )}
              </button>
              <button
                className="pd-btn-wish-inline"
                onClick={handleToggleWishlist}
                aria-label={
                  isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                }
              >
                <FaHeart
                  size={16}
                  style={{
                    color: isWishlisted ? "#c0392b" : "#ccc",
                    transition: "color .2s",
                  }}
                />
              </button>
            </div>

            <button
              className="pd-btn-buy"
              onClick={handleBuyNow}
              disabled={isActionDisabled}
            >
              Buy Now
            </button>

            <button className="pd-btn-share" onClick={handleShare}>
              <FaShareAlt size={11} />
              <span className={shareCopied ? "pd-share-copied" : ""}>
                {shareCopied ? "Link copied" : "Share Product"}
              </span>
            </button>

            {/* Delivery strip */}
            <div className="pd-delivery">
              <div className="pd-del-item">
                <span className="pd-del-icon-wrap">
                  <FaTruck className="pd-del-icon" size={13} />
                </span>
                <div>
                  <div
                    style={{
                      fontFamily: "Jost,sans-serif",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: ".1em",
                      textTransform: "uppercase",
                      color: "var(--ink)",
                      marginBottom: 2,
                    }}
                  >
                    Free Shipping
                  </div>
                  <div style={{ fontSize: 11 }}>No Shipping Fee</div>
                </div>
              </div>
              <div className="pd-del-item">
                <span className="pd-del-icon-wrap">
                  <FaUndo className="pd-del-icon" size={12} />
                </span>
                <div>
                  <div
                    style={{
                      fontFamily: "Jost,sans-serif",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: ".1em",
                      textTransform: "uppercase",
                      color: "var(--ink)",
                      marginBottom: 2,
                    }}
                  >
                    Easy Returns
                  </div>
                  <div style={{ fontSize: 11 }}>7-day hassle-free</div>
                </div>
              </div>
              <div className="pd-del-item">
                <span className="pd-del-icon-wrap">
                  <FaShieldAlt className="pd-del-icon" size={12} />
                </span>
                <div>
                  <div
                    style={{
                      fontFamily: "Jost,sans-serif",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: ".1em",
                      textTransform: "uppercase",
                      color: "var(--ink)",
                      marginBottom: 2,
                    }}
                  >
                    Secure Payment
                  </div>
                  <div style={{ fontSize: 11 }}>SSL encrypted checkout</div>
                </div>
              </div>
            </div>

            {/* Accordion */}
            <AccordionSection title="Product Details">
              <p>
                Crafted from 100% natural linen. Breathable, lightweight, and
                made to last. Garment measurements may vary by size — see size
                guide for exact fit details.
              </p>
            </AccordionSection>
            <AccordionSection title="Care Instructions">
              <p>
                Machine wash cold on gentle cycle. Do not tumble dry. Iron on
                low heat. Dry flat for best results. Natural fabrics may soften
                with each wash.
              </p>
            </AccordionSection>
            <AccordionSection title="Sustainability">
              <p>
                {product.sustainability
                  ? `${product.sustainability} — We're committed to ethical sourcing and minimal-impact production. Each piece is made with care for people and planet.`
                  : "We are committed to ethical sourcing and sustainable manufacturing practices across our entire supply chain."}
              </p>
            </AccordionSection>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
                    RELATED PRODUCTS
                    Only rendered when there is at least 1 result
                    (or while loading).
                ══════════════════════════════════════════════════ */}
        {(relatedLoading || related.length > 0) && (
          <section className="pd-related" aria-label="You may also like">
            {/* Header */}
            <div className="pd-related-header">
              <div className="pd-related-heading-group">
                <span className="pd-related-eyebrow">
                  {product.category_name
                    ? `More from ${product.category_name}`
                    : "You may also like"}
                </span>
                <h2 className="pd-related-title">Related Pieces</h2>
              </div>
              <Link href="/products" className="pd-related-view-all">
                View all <FaArrowRight size={9} />
              </Link>
            </div>

            {/* Grid */}
            <div className="pd-related-grid">
              {relatedLoading
                ? /* ── Skeleton placeholders while loading ── */
                  [0, 1, 2, 3].map((i) => (
                    <div key={i} className="pd-rel-skeleton" aria-hidden="true">
                      <div className="pd-rel-skel-img" />
                      <div
                        className="pd-rel-skel-line"
                        style={{ width: "75%" }}
                      />
                      <div className="pd-rel-skel-line pd-rel-skel-line-sm" />
                    </div>
                  ))
                : /* ── Actual cards ── */
                  related.map((rel) => {
                    const cardImg = getRelatedCardImage(rel);
                    const cardPrice = Number(rel.price);
                    const cardCompare = rel.compare_price
                      ? Number(rel.compare_price)
                      : null;
                    return (
                      <Link
                        key={rel.id}
                        href={`/products/${rel.id}`}
                        className="pd-rel-card"
                        aria-label={`View ${rel.name}`}
                      >
                        <div className="pd-rel-img-wrap">
                          <img
                            src={cardImg}
                            alt={rel.name}
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "/images/placeholders/placeholder.jpg";
                            }}
                          />
                          {/* Hover overlay */}
                          <div className="pd-rel-overlay" aria-hidden="true">
                            <span className="pd-rel-overlay-label">
                              View Product
                            </span>
                          </div>
                        </div>
                        <div className="pd-rel-info">
                          <span className="pd-rel-name">{rel.name}</span>
                          <div className="pd-rel-price-row">
                            <span className="pd-rel-price">
                              ${cardPrice.toFixed(2)}
                            </span>
                            {cardCompare && cardCompare > cardPrice && (
                              <span className="pd-rel-compare">
                                ${cardCompare.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

/* ── Size Guide Panel (unchanged) ── */
function SizeGuidePanel({ description }: { description: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="pd-size-guide">
      <button
        className="pd-size-guide-btn"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="pd-size-guide-label">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 3H3v18h18V3z" />
            <path d="M9 3v18" />
            <path d="M3 9h6" />
            <path d="M3 15h6" />
          </svg>
          Size Guide
        </span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`pd-size-guide-chevron${open ? " open" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div className={`pd-size-guide-body${open ? " open" : ""}`}>
        <div className="pd-size-guide-content">{description}</div>
      </div>
    </div>
  );
}

/* ── Accordion sub-component (unchanged) ── */
function AccordionSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="pd-accordion-item">
      <button className="pd-accordion-btn" onClick={() => setOpen((o) => !o)}>
        {title}
        <FaArrowRight
          className={`pd-accordion-chevron${open ? " open" : ""}`}
          size={10}
        />
      </button>
      <div className={`pd-accordion-body${open ? " open" : ""}`}>
        {children}
      </div>
    </div>
  );
}
