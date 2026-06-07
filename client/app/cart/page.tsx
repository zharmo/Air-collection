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
  colors?: ProductColor[];
  sizes?: ProductSize[];
}

interface SizeOption {
  name: string;
  available: boolean;
}

export default function CartPage() {
  const { cart, updateQuantity, updateItemSize, removeFromCart, clearCart } =
    useCart();
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
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
            return [productId, res.data.data as ProductDetails] as const;
          } catch (error) {
            console.error("Failed to fetch product sizes", {
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
      const available = Boolean(size.is_available && Number(size.stock) > 0);
      const existing = optionsByName.get(size.size_name);

      if (!existing || (!existing.available && available)) {
        optionsByName.set(size.size_name, { name: size.size_name, available });
      }
    });

    if (item.size && !optionsByName.has(item.size)) {
      optionsByName.set(item.size, { name: item.size, available: true });
    }

    return Array.from(optionsByName.values());
  };

  const handleApplyPromo = () => {
    if (promoCode.toUpperCase() === "AIR10") {
      setDiscount(subtotal * 0.1);
    } else {
      alert("Invalid promo code");
    }
  };

  // No login check – always show cart (empty or full)
  if (cart.items.length === 0) {
    return (
      <div className="container py-5 text-center">
        <div className="display-1 mb-3">🛒</div>
        <h2>Your bag is empty</h2>
        <p className="text-muted mb-4">
          Looks like you haven't added anything yet.
        </p>
        <Link href="/" className="btn btn-dark rounded-0 px-4">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <style>{`
                .cart-size-field {
                    width: 100%;
                }

                .cart-size-label {
                    margin-bottom: 8px;
                    font-size: 11px;
                    font-weight: 600;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: #6c757d;
                }

                .cart-size-options {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                }

                .cart-size-btn {
                    width: 32px;
                    height: 30px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid #d9d9d9;
                    background: #fff;
                    color: #222;
                    font-size: 12px;
                    font-weight: 600;
                    letter-spacing: 0.03em;
                    line-height: 1;
                    transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease, opacity 0.15s ease;
                }

                .cart-size-btn:hover:not(:disabled) {
                    border-color: #111;
                }

                .cart-size-btn.active {
                    background: #050505;
                    border-color: #050505;
                    color: #fff;
                }

                .cart-size-btn:disabled {
                    color: #b8b8b8;
                    background: #f7f7f7;
                    cursor: not-allowed;
                    opacity: 0.65;
                    text-decoration: line-through;
                }

                @media (max-width: 575px) {
                    .cart-size-btn {
                        width: 32px;
                        height: 30px;
                        font-size: 12px;
                    }
                }
            `}</style>
      <h1 className="fw-bold mb-4">Shopping Cart</h1>
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              {cart.items.map((item) => {
                const sizeOptions = getSizeOptions(item);

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
                          <h5 className="fw-bold mb-1">{item.name}</h5>
                          <p className="text-muted small mb-2">
                            {item.color && `COLOR: ${item.color}`}
                          </p>
                        </div>
                        <div className="fw-bold">
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
                            disabled={item.quantity <= 1}
                          >
                            -
                          </button>
                          <span className="px-3">{item.quantity}</span>
                          <button
                            className="btn btn-sm border-0"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
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
                    </div>
                  </div>
                );
              })}
              <div className="mt-3 pt-2">
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  <FaTag className="text-muted" />
                  <span className="text-muted">PROMO CODE</span>
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
                {discount > 0 && (
                  <div className="text-success small mt-2">
                    10% discount applied!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3">Order Summary</h5>
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="d-flex justify-content-between mb-2 text-success">
                  <span>Discount</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <hr />
              <div className="d-flex justify-content-between fw-bold fs-5 mb-4">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <Link
                href="/checkout"
                className="btn btn-dark rounded-0 w-100 py-2"
              >
                Checkout
              </Link>
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
