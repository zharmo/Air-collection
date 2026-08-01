"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaTrashAlt, FaTag } from "react-icons/fa";
import { useCart } from "@/context/CartContext";
import axiosInstance from "@/utils/axiosConfig";

interface ProductColor {
  id: number;
  color_name: string;
}

interface ProductSize {
  id: number;
  color_id: number | null;
  size_name: string;
  stock: number;
  is_available: boolean;
}

interface ProductDetails {
  stock_quantity?: number;
  colors?: ProductColor[];
  sizes?: ProductSize[];
  category_id?: number; // <-- added for promo category validation
}

interface SizeOption {
  name: string;
  available: boolean;
  stock: number;
}

const cartStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Jost:wght@300;400;500;600;700&display=swap');

  .cart-page {
    --ink:        #0a0a0a;
    --ink-soft:   #5c5c5c;
    --ink-faint:  #a3a3a3;
    --white:      #ffffff;
    --warm:       #faf9f6;
    --muted:      #f4f2ee;
    --accent:     #c8a96e;
    --accent-dk:  #a9854d;
    --accent-lt:  #f2e9d6;
    --success:    #2d7a4f;
    --danger:     #c0392b;
    --border:     rgba(10,10,10,0.07);
    --border-md:  rgba(10,10,10,0.12);
    --glass:      rgba(255,255,255,0.68);
    --shadow-xs:  0 1px 3px rgba(10,10,10,0.04);
    --shadow-sm:  0 4px 20px rgba(10,10,10,0.05);
    --shadow-md:  0 16px 48px rgba(10,10,10,0.09);
    --shadow-lg:  0 28px 80px rgba(10,10,10,0.14);
    --shadow-gold: 0 10px 30px rgba(200,169,110,0.25);

    max-width: 1240px;
    margin: 0 auto;
    padding: 60px 28px 100px;
    font-family: 'Jost', sans-serif;
    color: var(--ink);
    background:
      radial-gradient(900px 460px at 8% -8%, rgba(200,169,110,.10), transparent 60%),
      radial-gradient(700px 420px at 100% 0%, rgba(10,10,10,.03), transparent 55%);
    background-attachment: fixed;
    -webkit-font-smoothing: antialiased;
  }

  *, .cart-page *, .cart-page *::before, .cart-page *::after {
    box-sizing: border-box;
  }

  /* ── Header ── */
  .cart-header {
    text-align: center;
    padding: 12px 20px 48px;
    animation: cartFadeUp .5s cubic-bezier(.16,1,.3,1) both;
  }

  .cart-eyebrow {
    font-family: 'Jost', sans-serif;
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: .28em;
    text-transform: uppercase;
    color: var(--ink-faint);
    margin: 0 0 14px;
    text-align: center;
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }
  .cart-eyebrow::before,
  .cart-eyebrow::after {
    content: '';
    display: inline-block;
    width: 26px;
    height: 1px;
    background: var(--accent);
  }

  .cart-header h1,
  .cart-empty h2 {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(40px, 5.2vw, 68px);
    font-weight: 600;
    color: var(--ink);
    line-height: .98;
    margin: 0;
    letter-spacing: -.01em;
  }

  .cart-header p,
  .cart-empty p {
    font-family: 'Jost', sans-serif;
    font-size: 14px;
    font-weight: 300;
    letter-spacing: .02em;
    color: var(--ink-soft);
    margin: 18px auto 0;
  }

  .cart-header .cart-eyebrow {
    font-size: 10.5px;
    font-weight: 600;
    color: var(--ink-faint);
    margin: 0 0 14px;
  }

  /* ── Panels (glassmorphism) ── */
  .cart-page .card {
    border: none;
  }

  .cart-panel {
    border: 1px solid var(--border) !important;
    border-radius: 22px !important;
    box-shadow: var(--shadow-md) !important;
    background: var(--glass) !important;
    backdrop-filter: blur(22px) saturate(160%);
    -webkit-backdrop-filter: blur(22px) saturate(160%);
    overflow: hidden;
    transition: box-shadow .3s ease;
    animation: cartFadeUp .55s cubic-bezier(.16,1,.3,1) both;
  }

  .cart-page .card-body.p-4 {
    padding: 34px !important;
  }

  /* sticky order summary */
  .cart-page .col-lg-4 .cart-panel {
    position: sticky;
    top: 100px;
  }
  .cart-page .col-lg-4 .cart-panel:hover {
    box-shadow: var(--shadow-lg) !important;
  }

  @media (max-width: 991px) {
    .cart-page .col-lg-4 .cart-panel {
      position: static;
    }
  }

  /* ── Product rows ── */
  .cart-panel .border-bottom {
    border-bottom: 1px solid var(--border) !important;
    padding-bottom: 26px !important;
    margin-bottom: 26px !important;
    border-radius: 14px;
    transition: transform .25s cubic-bezier(.16,1,.3,1), background .25s ease;
  }
  .cart-panel .border-bottom:hover {
    background: rgba(10,10,10,0.015);
  }
  .cart-panel .border-bottom:last-of-type {
    border-bottom: 1px solid var(--border) !important;
  }

  .cart-panel .bg-light {
    background: linear-gradient(145deg, var(--muted), #eeece6) !important;
    border-radius: 14px !important;
    border: 1px solid var(--border);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,.5);
    transition: transform .3s cubic-bezier(.16,1,.3,1);
  }
  .cart-panel .border-bottom:hover .bg-light {
    transform: scale(1.03);
  }
  .cart-panel .bg-light img {
    transition: transform .4s cubic-bezier(.16,1,.3,1);
  }
  .cart-panel .border-bottom:hover .bg-light img {
    transform: scale(1.07);
  }

  .cart-item-title {
    font-family: 'Jost', sans-serif;
    font-size: 15.5px;
    font-weight: 600;
    letter-spacing: .01em;
    color: var(--ink);
  }

  .cart-item-meta,
  .cart-promo-label,
  .cart-summary-row {
    font-family: 'Jost', sans-serif;
    font-size: 12px;
    font-weight: 400;
    letter-spacing: .04em;
    color: var(--ink-soft);
  }

  .cart-promo-label {
    font-weight: 600;
    letter-spacing: .16em;
    text-transform: uppercase;
    font-size: 10.5px;
    color: var(--ink);
  }

  .cart-line-price,
  .cart-total-row {
    font-family: 'Cormorant Garamond', serif;
    font-size: 23px;
    font-weight: 600;
    color: var(--ink);
  }

  .cart-total-row {
    font-size: 30px;
  }

  .cart-summary-title {
    font-family: 'Jost', sans-serif;
    font-size: 11.5px;
    font-weight: 700;
    letter-spacing: .22em;
    text-transform: uppercase;
    color: var(--ink);
    position: relative;
    padding-bottom: 16px;
  }
  .cart-summary-title::after {
    content: '';
    position: absolute;
    left: 0; bottom: 0;
    width: 32px; height: 2px;
    background: var(--accent);
  }

  .cart-muted-icon {
    color: var(--accent);
  }

  /* ── Quantity stepper ── */
  .cart-panel .d-flex.align-items-center.border {
    border: 1px solid var(--border-md) !important;
    border-radius: 999px !important;
    overflow: hidden;
    background: var(--white);
    box-shadow: var(--shadow-xs);
  }
  .cart-panel .d-flex.align-items-center.border .btn {
    width: 34px;
    height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 500;
    color: var(--ink);
    border-radius: 0 !important;
    transition: background .18s ease, color .18s ease;
  }
  .cart-panel .d-flex.align-items-center.border .btn:hover:not(:disabled) {
    background: var(--ink);
    color: var(--white);
  }
  .cart-panel .d-flex.align-items-center.border .btn:disabled {
    color: var(--ink-faint);
    cursor: not-allowed;
  }
  .cart-panel .d-flex.align-items-center.border span.px-3 {
    font-family: 'Jost', sans-serif;
    font-size: 13px;
    font-weight: 600;
    min-width: 30px;
    text-align: center;
  }

  /* remove item */
  .cart-panel .btn-link.text-danger {
    color: var(--ink-faint) !important;
    font-size: 15px;
    padding: 8px !important;
    border-radius: 999px;
    transition: color .2s ease, background .2s ease, transform .2s ease;
  }
  .cart-panel .btn-link.text-danger:hover {
    color: var(--danger) !important;
    background: rgba(192,57,43,0.08);
    transform: scale(1.08);
  }

  /* ── Sizes ── */
  .cart-size-field { width: 100%; margin-top: 4px; }

  .cart-size-options {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .cart-size-btn {
    width: 36px;
    height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border-md);
    border-radius: 8px;
    background: var(--white);
    color: var(--ink);
    font-family: 'Jost', sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.03em;
    line-height: 1;
    transition: border-color .18s ease, background .18s ease, color .18s ease,
      opacity .18s ease, transform .18s ease, box-shadow .18s ease;
  }

  .cart-size-btn:hover:not(:disabled) {
    border-color: var(--ink);
    transform: translateY(-1px);
    box-shadow: var(--shadow-xs);
  }

  .cart-size-btn.active {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--white);
    box-shadow: var(--shadow-gold);
  }

  .cart-size-btn:disabled {
    color: #c2c2c2;
    background: #f7f7f5;
    border-color: var(--border);
    cursor: not-allowed;
    opacity: 0.7;
    text-decoration: line-through;
  }

  .cart-stock-note {
    font-family: 'Jost', sans-serif;
    font-size: 11.5px;
    font-weight: 500;
    letter-spacing: .02em;
    color: var(--danger);
    margin-top: 10px;
  }

  /* ── Promo code ── */
  .cart-panel .form-control {
    border: 1px solid var(--border-md);
    border-radius: 10px !important;
    font-family: 'Jost', sans-serif;
    font-size: 13px;
    padding: 9px 14px;
    background: var(--white);
    transition: border-color .2s ease, box-shadow .2s ease;
  }
  .cart-panel .form-control:focus {
    border-color: var(--ink);
    box-shadow: 0 0 0 3px rgba(10,10,10,0.06);
    outline: none;
  }

  .cart-panel .btn-dark {
    background: var(--ink) !important;
    border: 1px solid var(--ink) !important;
    border-radius: 10px !important;
    font-family: 'Jost', sans-serif;
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: .16em;
    padding: 9px 20px;
    position: relative;
    overflow: hidden;
    transition: transform .2s ease, box-shadow .2s ease;
  }
  .cart-panel .btn-dark::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, transparent, rgba(255,255,255,.22), transparent);
    transform: translateX(-120%);
    transition: transform .5s ease;
  }
  .cart-panel .btn-dark:hover::before {
    transform: translateX(120%);
  }
  .cart-panel .btn-dark:hover {
    box-shadow: var(--shadow-sm);
  }
  .cart-panel .btn-dark:active {
    transform: scale(.97);
  }

  .cart-panel .text-success.small {
    font-family: 'Jost', sans-serif;
    font-size: 12px;
    font-weight: 500;
    color: var(--success) !important;
  }

  /* ── Summary rows ── */
  .cart-panel hr {
    border: none;
    border-top: 1px solid var(--border);
    margin: 20px 0;
  }

  /* ── Checkout button ── */
  .cart-primary-link,
  .cart-page a.btn.btn-dark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 52px;
    padding: 0 30px;
    background: linear-gradient(135deg, #141414, #0a0a0a) !important;
    color: #fff !important;
    text-decoration: none;
    font-family: 'Jost', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .2em;
    text-transform: uppercase;
    border: none !important;
    border-radius: 12px !important;
    position: relative;
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    transition: transform .28s cubic-bezier(.16,1,.3,1), box-shadow .28s ease;
  }
  .cart-primary-link { margin-top: 26px; }

  .cart-primary-link::after,
  .cart-page a.btn.btn-dark::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, transparent 30%, rgba(200,169,110,.55) 50%, transparent 70%);
    transform: translateX(-140%);
    transition: transform .6s cubic-bezier(.16,1,.3,1);
  }
  .cart-primary-link:hover,
  .cart-page a.btn.btn-dark:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
    color: #fff;
  }
  .cart-primary-link:hover::after,
  .cart-page a.btn.btn-dark:hover::after {
    transform: translateX(140%);
  }
  .cart-primary-link:active,
  .cart-page a.btn.btn-dark:active {
    transform: translateY(0) scale(.98);
  }

  .cart-checkout-disabled {
    pointer-events: none;
    opacity: .4;
    filter: grayscale(.3);
  }

  .cart-page .btn-link.text-muted {
    font-family: 'Jost', sans-serif;
    font-size: 11.5px;
    font-weight: 500;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--ink-faint) !important;
    text-decoration: none;
    transition: color .2s ease;
  }
  .cart-page .btn-link.text-muted:hover {
    color: var(--ink) !important;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  /* ── Empty state ── */
  .cart-empty {
    min-height: 68vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    animation: cartFadeUp .5s cubic-bezier(.16,1,.3,1) both;
  }

  .cart-empty-icon,
  .cart-empty .display-1 {
    width: 96px;
    height: 96px;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, var(--accent-lt), var(--muted));
    color: var(--accent-dk);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 26px;
    font-size: 32px;
    box-shadow: var(--shadow-sm);
  }

  /* ── Focus / accessibility ── */
  .cart-page button:focus-visible,
  .cart-page a:focus-visible,
  .cart-page input:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  @keyframes cartFadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .cart-page * { animation: none !important; transition: none !important; }
  }

  /* ── Responsive ── */
  @media (max-width: 991px) {
    .cart-page .card-body.p-4 { padding: 26px !important; }
  }

  @media (max-width: 575px) {
    .cart-page {
      padding: 40px 16px 72px;
    }

    .cart-header {
      padding: 8px 8px 32px;
    }

    .cart-panel { border-radius: 18px !important; }

    .cart-panel .bg-light { width: 84px !important; height: 84px !important; }

    .cart-size-btn {
      width: 34px;
      height: 32px;
      font-size: 11.5px;
    }

    .cart-total-row { font-size: 26px; }
  }
`;

export default function CartPage() {
  const { cart, updateQuantity, updateItemSize, removeFromCart, clearCart } =
    useCart();
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState("");
  const [productDetails, setProductDetails] = useState<
    Record<number, ProductDetails>
  >({});

  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
    "http://localhost:5000";

  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return "/images/placeholders/placeholder.jpg";
    if (imagePath.startsWith("/uploads")) return `${backendUrl}${imagePath}`;
    return imagePath;
  };

  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const total = subtotal - discount;

  // ── Fetch product details (including category_id) for all cart items ──
  useEffect(() => {
    const productIds = Array.from(
      new Set(cart.items.map((item) => item.product_id)),
    );
    const missingIds = productIds.filter((id) => !productDetails[id]);

    if (missingIds.length === 0) return;

    let isMounted = true;
    const fetchProductDetails = async () => {
      const detailEntries = await Promise.all(
        missingIds.map(async (productId) => {
          try {
            const res = await axiosInstance.get(`/products/${productId}`);
            const product = res.data.data;
            // Ensure we capture category_id
            return [productId, {
              stock_quantity: product.stock_quantity,
              colors: product.colors,
              sizes: product.sizes,
              category_id: product.category_id, // <-- added
            } as ProductDetails] as const;
          } catch (error) {
            console.error("Failed to fetch product details", {
              productId,
              error,
            });
            return [productId, { sizes: [] } as ProductDetails] as const;
          }
        }),
      );

      if (!isMounted) return;
      setProductDetails((prev) => ({
        ...prev,
        ...Object.fromEntries(detailEntries),
      }));
    };

    fetchProductDetails();

    return () => {
      isMounted = false;
    };
  }, [cart.items, productDetails]);

  const getSizeOptions = (item: {
    product_id: number;
    color?: string;
    size?: string;
  }): SizeOption[] => {
    const details = productDetails[item.product_id];
    const sizes = details?.sizes || [];

    if (sizes.length === 0) return [];

    const selectedColor = item.color
      ? details?.colors?.find((color) => color.color_name === item.color)
      : undefined;

    const relevantSizes = selectedColor
      ? sizes.filter(
          (size) =>
            size.color_id === null || size.color_id === selectedColor.id,
        )
      : sizes;

    const optionsByName = new Map<string, SizeOption>();
    relevantSizes.forEach((size) => {
      if (!size.size_name) return;
      const stock = Number(size.stock) || 0;
      const available = Boolean(size.is_available && stock > 0);
      const existing = optionsByName.get(size.size_name);

      if (!existing || existing.stock < stock || (!existing.available && available)) {
        optionsByName.set(size.size_name, {
          name: size.size_name,
          available,
          stock,
        });
      }
    });

    if (item.size && !optionsByName.has(item.size)) {
      optionsByName.set(item.size, { name: item.size, available: true, stock: 1 });
    }

    return Array.from(optionsByName.values());
  };

  const getAvailableStock = (item: {
    product_id: number;
    color?: string;
    size?: string;
  }) => {
    const details = productDetails[item.product_id];
    if (!details) return undefined;

    const productStock = Number(details.stock_quantity);
    if (Number.isFinite(productStock) && productStock <= 0) return 0;

    const sizeOptions = getSizeOptions(item);
    if (sizeOptions.length > 0) {
      if (!item.size) return 0;

      const selectedSize = sizeOptions.find((option) => option.name === item.size);
      if (!selectedSize || !selectedSize.available) return 0;

      return Number.isFinite(productStock)
        ? Math.min(productStock, selectedSize.stock)
        : selectedSize.stock;
    }

    return Number.isFinite(productStock) ? productStock : undefined;
  };

  // ── helper: distinguishes "no size chosen yet" from an actual stock-out ──
  const needsSizeSelection = (item: {
    product_id: number;
    color?: string;
    size?: string;
  }) => {
    const sizeOptions = getSizeOptions(item);
    return sizeOptions.length > 0 && !item.size;
  };

  const stockBlockedItems = cart.items.filter((item) => {
    const stock = getAvailableStock(item);
    return stock !== undefined && (stock <= 0 || item.quantity > stock);
  });

  useEffect(() => {
    cart.items.forEach((item) => {
      const stock = getAvailableStock(item);
      if (stock !== undefined && stock > 0 && item.quantity > stock) {
        updateQuantity(item.id, stock);
      }
    });
  }, [cart.items, productDetails]);

  // ── helper: collect category IDs from cart items ──
  const getCategoryIds = (): number[] => {
    const ids: number[] = [];
    cart.items.forEach((item) => {
      const details = productDetails[item.product_id];
      if (details?.category_id) {
        ids.push(details.category_id);
      }
    });
    return ids;
  };

  // ── handleApplyPromo with category IDs ──
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      alert("Please enter a promo code");
      return;
    }

    // Get category IDs from cart items
    const categoryIds = getCategoryIds();

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiUrl}/promocodes/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promoCode.trim(),
          subtotal: subtotal,
          categoryIds: categoryIds, // <-- send category IDs
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Invalid promo code");
        setDiscount(0);
        setPromoMessage("");
        sessionStorage.removeItem("checkoutDiscount");
        return;
      }

      if (data.valid) {
        let discountAmount = 0;
        if (data.discountType === "percentage") {
          discountAmount = subtotal * (data.discountValue / 100);
        } else {
          discountAmount = Math.min(data.discountValue, subtotal);
        }
        setDiscount(discountAmount);
        const typeLabel = data.discountType === "percentage"
          ? `${data.discountValue}% off`
          : `$${data.discountValue.toFixed(2)} off`;
        setPromoMessage(`✅ ${data.code} applied (${typeLabel})`);

        // Save complete discount info to sessionStorage
        const discountData = {
          discount: discountAmount,
          code: data.code,
          discountType: data.discountType,
          discountValue: data.discountValue,
        };
        sessionStorage.setItem("checkoutDiscount", JSON.stringify(discountData));

        console.log("✅ Discount saved:", discountData);
      } else {
        alert(data.message || "Invalid promo code");
        setDiscount(0);
        setPromoMessage("");
        sessionStorage.removeItem("checkoutDiscount");
      }
    } catch (error) {
      console.error("Promo validation error:", error);
      alert("Network error – please try again");
      setDiscount(0);
      setPromoMessage("");
      sessionStorage.removeItem("checkoutDiscount");
    }
  };

  // If discount becomes 0 (e.g., cart changes, code removed), clear storage
  useEffect(() => {
    if (discount === 0) {
      sessionStorage.removeItem("checkoutDiscount");
    }
  }, [discount]);

  // No login check – always show cart (empty or full)
  if (cart.items.length === 0) {
    return (
      <div className="cart-page cart-empty">
        <style>{cartStyles}</style>
        <div className="display-1 mb-3">🛒</div>
        <h2>Your Bag Is Empty</h2>
        <p>Looks like you haven't added anything yet.</p>
        <Link href="/products" className="cart-primary-link">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <style>{cartStyles}</style>
      <header className="cart-header">
        <p className="cart-eyebrow">The Collection</p>
        <h1>Shopping Cart</h1>
        <p>
          {cart.items.length} {cart.items.length === 1 ? "item" : "items"} ready
          for checkout
        </p>
      </header>
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm cart-panel">
            <div className="card-body p-4">
              {cart.items.map((item) => {
                const sizeOptions = getSizeOptions(item);
                const availableStock = getAvailableStock(item);
                const stockOut =
                  availableStock !== undefined && availableStock <= 0;
                const overStock =
                  availableStock !== undefined && item.quantity > availableStock;
                const missingSize = needsSizeSelection(item);

                return (
                  <div
                    key={item.id}
                    className="d-flex flex-wrap gap-3 mb-4 pb-3 border-bottom"
                  >
                    <div
                      className="bg-light d-flex align-items-center justify-content-center overflow-hidden"
                      style={{ width: "100px", height: "100px" }}
                    >
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex flex-wrap justify-content-between align-items-start">
                        <div>
                          <h5 className="cart-item-title mb-1">{item.name}</h5>
                          <p className="cart-item-meta mb-2">
                            {item.color && `COLOR: ${item.color}`}
                          </p>
                        </div>
                        <div className="cart-line-price">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                      {sizeOptions.length > 0 && (
                        <div className="cart-size-field mb-2">
                          <div
                            className="cart-size-options"
                            role="radiogroup"
                            aria-label={`Size for ${item.name}`}
                          >
                            {sizeOptions.map((option) => {
                              const selected = option.name === item.size;
                              const disabled = !option.available && !selected;

                              return (
                                <button
                                  key={option.name}
                                  type="button"
                                  className={`cart-size-btn${selected ? " active" : ""}`}
                                  onClick={() =>
                                    updateItemSize(item.id, option.name)
                                  }
                                  disabled={disabled}
                                  role="radio"
                                  aria-checked={selected}
                                  title={
                                    disabled
                                      ? `${option.name} is out of stock`
                                      : `Select ${option.name}`
                                  }
                                >
                                  {option.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      <div className="d-flex align-items-center gap-3 mt-2">
                        <div className="d-flex align-items-center border rounded-0">
                          <button
                            className="btn btn-sm border-0"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            disabled={item.quantity <= 1 || stockOut}
                          >
                            -
                          </button>
                          <span className="px-3">{item.quantity}</span>
                          <button
                            className="btn btn-sm border-0"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                availableStock !== undefined
                                  ? Math.min(availableStock, item.quantity + 1)
                                  : item.quantity + 1,
                              )
                            }
                            disabled={
                              stockOut ||
                              (availableStock !== undefined &&
                                item.quantity >= availableStock)
                            }
                          >
                            +
                          </button>
                        </div>
                        <button
                          className="btn btn-link text-danger p-0"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                      {(stockOut || overStock) && (
                        <p className="cart-stock-note">
                          {missingSize
                            ? "Please select a size."
                            : stockOut
                            ? "Stock out. Please remove this item."
                            : `Only ${availableStock} left in stock.`}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              <div className="mt-3 pt-2">
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  <FaTag className="cart-muted-icon" />
                  <span className="cart-promo-label">PROMO CODE</span>
                  <input
                    type="text"
                    className="form-control form-control-sm rounded-0"
                    style={{ width: "180px" }}
                    placeholder="Enter code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                  />
                  <button
                    className="btn btn-dark btn-sm rounded-0"
                    onClick={handleApplyPromo}
                  >
                    APPLY
                  </button>
                </div>
                {promoMessage && (
                  <div className="text-success small mt-2">{promoMessage}</div>
                )}
                {discount > 0 && !promoMessage && (
                  <div className="text-success small mt-2">
                    Discount applied!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm cart-panel">
            <div className="card-body p-4">
              <h5 className="cart-summary-title mb-3">Order Summary</h5>
              <div className="d-flex justify-content-between mb-2 cart-summary-row">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="d-flex justify-content-between mb-2 text-success cart-summary-row">
                  <span>Discount</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <hr />
              <div className="d-flex justify-content-between mb-4 cart-total-row">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <Link
                href="/checkout"
                className={`btn btn-dark rounded-0 w-100 py-2${
                  stockBlockedItems.length > 0 ? " cart-checkout-disabled" : ""
                }`}
                aria-disabled={stockBlockedItems.length > 0}
              >
                Checkout
              </Link>
              {stockBlockedItems.length > 0 && (
                <p className="cart-stock-note text-center">
                  Update unavailable items before checkout.
                </p>
              )}
              <button
                className="btn btn-link text-muted w-100 mt-2"
                onClick={clearCart}
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
