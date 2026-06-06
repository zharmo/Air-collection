'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FaStar, FaStarHalfAlt, FaRegStar, FaTruck, FaUndo, FaHeart } from 'react-icons/fa';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import axiosInstance from '@/utils/axiosConfig';

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
    images: { id: number; image_url: string; is_primary: boolean; color?: string }[];
    colors: ColorVariant[];
    sizes: SizeVariant[];
    stock_quantity: number;
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

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<ColorVariant | null>(null);
    const [selectedSize, setSelectedSize] = useState<SizeVariant | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [mainImage, setMainImage] = useState('');
    const [isWishlisted, setIsWishlisted] = useState(false);

    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await axiosInstance.get(`/products/${productId}`);
                const prod = res.data.data;
                setProduct(prod);
                if (prod.colors && prod.colors.length) {
                    setSelectedColor(prod.colors[0]);
                    setMainImage(getFullImageUrl(prod.colors[0].image_url));
                } else if (prod.images && prod.images.length) {
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
        if (product && wishlist?.items) {
            setIsWishlisted(wishlist.items.some((item: any) => item.product_id === product.id));
        }
    }, [wishlist, product]);

    const getFullImageUrl = (url: string) => {
        if (!url) return '/images/placeholders/placeholder.jpg';
        if (url.startsWith('/uploads')) return `${backendUrl}${url}`;
        return url;
    };

    useEffect(() => {
        if (selectedColor) {
            setMainImage(getFullImageUrl(selectedColor.image_url));
            setSelectedSize(null);
        }
    }, [selectedColor]);

    const filteredSizes = () => {
        if (!product) return [];
        if (!selectedColor) return product.sizes.filter(s => s.color_id === null);
        return product.sizes.filter(s => s.color_id === null || s.color_id === selectedColor.id);
    };

    useEffect(() => {
        if (selectedColor && product) {
            const available = filteredSizes().find(s => s.is_available && s.stock > 0);
            setSelectedSize(available || null);
        }
    }, [selectedColor, product]);

    const handleAddToCart = async () => {
        if (!selectedSize) {
            alert('Please select a size');
            return;
        }
        // Get the correct image for the selected color (or primary)
        let imageUrl = '';
        if (selectedColor?.image_url) {
            imageUrl = getFullImageUrl(selectedColor.image_url);
        } else if (product?.images?.length) {
            const primary = product.images.find(img => img.is_primary) || product.images[0];
            imageUrl = getFullImageUrl(primary.image_url);
        }
        await addToCart(product!.id, quantity, {
            size: selectedSize.size_name,
            color: selectedColor?.color_name,
            name: product!.name,
            price: product!.price,
            image: imageUrl,
        });
        // Optional: show success message (no alert to keep quiet)
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
        const full = Math.floor(rating);
        const half = rating % 1 !== 0;
        const empty = 5 - full - (half ? 1 : 0);
        return (
            <>
                {[...Array(full)].map((_, i) => <FaStar key={i} className="text-warning" />)}
                {half && <FaStarHalfAlt className="text-warning" />}
                {[...Array(empty)].map((_, i) => <FaRegStar key={i} className="text-warning" />)}
            </>
        );
    };

    if (loading) return <div className="container py-5 text-center"><div className="spinner-border text-dark" /></div>;
    if (error || !product) return <div className="container py-5 text-center"><h2>Product not found</h2><Link href="/" className="btn btn-dark rounded-0 mt-3">Back to Home</Link></div>;

    const availableSizes = filteredSizes();

    return (
        <div className="container py-5">
            <nav className="mb-4">
                <ol className="breadcrumb bg-transparent p-0">
                    <li className="breadcrumb-item"><Link href="/" className="text-muted text-decoration-none">Home</Link></li>
                    <li className="breadcrumb-item active text-dark">{product.name}</li>
                </ol>
            </nav>

            <div className="row g-5">
                {/* Image Gallery */}
                <div className="col-md-6">
                    <div className="d-flex align-items-center justify-content-center p-3" style={{ minHeight: '450px', backgroundColor: '#fff' }}>
                        <img src={mainImage} alt={product.name} className="img-fluid" style={{ maxHeight: '400px', objectFit: 'contain' }} />
                    </div>
                    {product.colors && product.colors.length > 1 && (
                        <div className="d-flex flex-wrap gap-2 justify-content-center mt-3">
                            {product.colors.map((color) => (
                                <div
                                    key={color.id}
                                    className={`border p-1 ${selectedColor?.id === color.id ? 'border-dark' : 'border-secondary'}`}
                                    style={{ width: '60px', cursor: 'pointer' }}
                                    onClick={() => setSelectedColor(color)}
                                >
                                    <img src={getFullImageUrl(color.image_url)} alt={color.color_name} className="img-fluid" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="col-md-6">
                    <div className="d-flex justify-content-between align-items-start flex-wrap">
                        <h1 className="display-5 fw-bold mb-2">{product.name}</h1>
                        <div className="text-end">
                            {product.sustainability && <span className="badge bg-success rounded-0 px-3 py-2 mb-2">{product.sustainability}</span>}
                            <div className="d-flex align-items-center">
                                <span className="fw-bold fs-5 me-1">{product.rating || 0}</span>
                                <span className="text-muted me-2">/5</span>
                                {renderStars(product.rating || 0)}
                            </div>
                        </div>
                    </div>
                    <div className="mb-3">
                        <span className="fs-2 fw-bold">${product.price}</span>
                        {product.compare_price && <span className="text-muted ms-2"><del>${product.compare_price}</del></span>}
                    </div>
                    <p className="text-muted mb-4">{product.description}</p>

                    {/* Color selection */}
                    {product.colors && product.colors.length > 0 && (
                        <div className="mb-4">
                            <label className="fw-semibold mb-2">COLOR / {selectedColor?.color_name}</label>
                            <div className="d-flex flex-wrap gap-2">
                                {product.colors.map(color => (
                                    <button
                                        key={color.id}
                                        className={`btn btn-sm ${selectedColor?.id === color.id ? 'btn-dark' : 'btn-outline-dark'} rounded-0`}
                                        onClick={() => setSelectedColor(color)}
                                    >
                                        {color.color_name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Size selection */}
                    {availableSizes.length > 0 ? (
                        <div className="mb-4">
                            <label className="fw-semibold mb-2">SELECT SIZE</label>
                            <div className="d-flex flex-wrap gap-2">
                                {availableSizes.map(size => (
                                    <button
                                        key={size.id}
                                        className={`btn btn-sm ${selectedSize?.id === size.id ? 'btn-dark' : 'btn-outline-dark'} rounded-0 position-relative`}
                                        onClick={() => setSelectedSize(size)}
                                        disabled={!size.is_available || size.stock === 0}
                                        style={{ opacity: (size.is_available && size.stock > 0) ? 1 : 0.5 }}
                                    >
                                        {size.size_name}
                                        {size.measurements && (
                                            <span className="d-block small text-muted">
                                                {size.measurements.waist && `Waist ${size.measurements.waist}"`}
                                                {size.measurements.length && ` Length ${size.measurements.length}"`}
                                                {size.measurements.chest && `Chest ${size.measurements.chest}"`}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted mb-4">No sizes available for this color.</p>
                    )}

                    {/* Quantity */}
                    <div className="mb-4">
                        <label className="fw-semibold mb-2">QUANTITY</label>
                        <div className="d-flex align-items-center gap-2">
                            <button className="btn btn-outline-secondary rounded-0 px-3" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                            <span className="px-4 py-1 border bg-light">{quantity}</span>
                            <button className="btn btn-outline-secondary rounded-0 px-3" onClick={() => setQuantity(quantity + 1)}>+</button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="d-flex flex-wrap gap-3 mb-4">
                        <button
                            className="btn btn-dark rounded-0 px-5 py-2 flex-grow-1"
                            onClick={handleAddToCart}
                            disabled={!selectedSize || !selectedSize.is_available || selectedSize.stock === 0}
                        >
                            {!selectedSize ? 'SELECT SIZE' : (selectedSize.stock === 0 ? 'OUT OF STOCK' : 'ADD TO BAG')}
                        </button>
                        <button
                            className="btn btn-outline-dark rounded-0 px-5 py-2 flex-grow-1"
                            onClick={handleBuyNow}
                            disabled={!selectedSize || !selectedSize.is_available || selectedSize.stock === 0}
                        >
                            BUY NOW
                        </button>
                        <button className={`btn btn-outline-dark rounded-0 px-3 ${isWishlisted ? 'active' : ''}`} onClick={handleToggleWishlist}>
                            <FaHeart className={isWishlisted ? 'text-danger' : ''} />
                        </button>
                    </div>

                    {/* Delivery Badges */}
                    {product.deliveryBadges && product.deliveryBadges.length > 0 && (
                        <div className="d-flex flex-wrap gap-4 pt-2 border-top">
                            {product.deliveryBadges.map((badge, idx) => (
                                <div key={idx} className="d-flex align-items-center gap-2 text-muted small"><FaTruck /><span>{badge.text}</span></div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}