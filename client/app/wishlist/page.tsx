'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaHeart, FaArrowRight, FaSort } from 'react-icons/fa';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import axiosInstance from '@/utils/axiosConfig';

interface WishlistItem {
    product_id: number;
    name: string;
    price: number;
    compare_price?: number;
    stock_quantity: number;
    image?: string;
}

export default function WishlistPage() {
    const { wishlist, removeFromWishlist, fetchWishlist } = useWishlist();
    const { addToCart } = useCart();
    const [items, setItems] = useState<WishlistItem[]>([]);
    const [filteredItems, setFilteredItems] = useState<WishlistItem[]>([]);
    const [filter, setFilter] = useState<'all' | 'lowstock' | 'instock'>('all');
    const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default');
    const [loading, setLoading] = useState(true);

    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

    // Fetch full product details for each wishlist item
    useEffect(() => {
        const fetchWishlistProducts = async () => {
            if (!wishlist.items.length) {
                setItems([]);
                setLoading(false);
                return;
            }
            try {
                const productPromises = wishlist.items.map(item =>
                    axiosInstance.get(`/products/${item.product_id}`).then(res => res.data.data)
                );
                const products = await Promise.all(productPromises);
                const enriched = products.map((prod, idx) => ({
                    product_id: prod.id,
                    name: prod.name,
                    price: prod.price,
                    compare_price: prod.compare_price,
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

    // Apply filters and sorting
    useEffect(() => {
        let filtered = [...items];
        if (filter === 'lowstock') {
            filtered = filtered.filter(item => item.stock_quantity > 0 && item.stock_quantity <= 5);
        } else if (filter === 'instock') {
            filtered = filtered.filter(item => item.stock_quantity > 0);
        }
        if (sortBy === 'price-asc') {
            filtered.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'price-desc') {
            filtered.sort((a, b) => b.price - a.price);
        }
        setFilteredItems(filtered);
    }, [items, filter, sortBy]);

    const handleMoveToBag = async (item: WishlistItem) => {
        // Add to cart
        await addToCart(item.product_id, 1, {
            name: item.name,
            price: item.price,
            image: getFullImageUrl(item.image),
        });
        // Remove from wishlist
        await removeFromWishlist(item.product_id);
        // Refresh wishlist (context will refetch)
        await fetchWishlist();
    };

    const getFullImageUrl = (imagePath?: string) => {
        if (!imagePath) return '/images/placeholders/placeholder.jpg';
        if (imagePath.startsWith('/uploads')) return `${backendUrl}${imagePath}`;
        return imagePath;
    };

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-dark" role="status"></div>
            </div>
        );
    }

    return (
        <div className="container py-5">
            {/* Header */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="fw-bold mb-1" style={{ fontWeight: 'normal' }}>COLLECTION</h1>
                    <p className="text-muted">{filteredItems.length} Items Saved</p>
                </div>
                {/* Sort dropdown */}
                <div className="dropdown">
                    <button
                        className="btn btn-outline-dark rounded-0 dropdown-toggle d-flex align-items-center gap-2"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                    >
                        <FaSort size={14} /> SORT
                    </button>
                    <ul className="dropdown-menu">
                        <li><button className="dropdown-item" onClick={() => setSortBy('default')}>Default</button></li>
                        <li><button className="dropdown-item" onClick={() => setSortBy('price-asc')}>Price: Low to High</button></li>
                        <li><button className="dropdown-item" onClick={() => setSortBy('price-desc')}>Price: High to Low</button></li>
                    </ul>
                </div>
            </div>

            {/* Filter buttons */}
            <div className="d-flex gap-2 mb-4">
                <button
                    className={`btn ${filter === 'all' ? 'btn-dark' : 'btn-outline-dark'} rounded-0`}
                    onClick={() => setFilter('all')}
                >
                    ALL
                </button>
                <button
                    className={`btn ${filter === 'lowstock' ? 'btn-dark' : 'btn-outline-dark'} rounded-0`}
                    onClick={() => setFilter('lowstock')}
                >
                    LOW STOCK
                </button>
                <button
                    className={`btn ${filter === 'instock' ? 'btn-dark' : 'btn-outline-dark'} rounded-0`}
                    onClick={() => setFilter('instock')}
                >
                    IN STOCK
                </button>
            </div>

            {/* Wishlist items grid */}
            {filteredItems.length === 0 ? (
                <div className="text-center py-5">
                    <div className="display-1 mb-3">🕊️</div>
                    <h3>Your wishlist is empty</h3>
                    <p className="text-muted">Save items you love to see them here.</p>
                    <Link href="/products" className="btn btn-dark rounded-0 mt-3">Start Shopping</Link>
                </div>
            ) : (
                <div className="row g-4">
                    {filteredItems.map((item) => {
                        const isLowStock = item.stock_quantity > 0 && item.stock_quantity <= 5;
                        const isOutOfStock = item.stock_quantity === 0;
                        return (
                            <div key={item.product_id} className="col-md-6 col-lg-4">
                                <div className="card border-0 shadow-sm h-100">
                                    {/* Image */}
                                    <div className="position-relative">
                                        <Link href={`/products/${item.product_id}`}>
                                            <div className="bg-light d-flex align-items-center justify-content-center overflow-hidden" style={{ aspectRatio: '1 / 1', cursor: 'pointer' }}>
                                                <img
                                                    src={getFullImageUrl(item.image)}
                                                    alt={item.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            </div>
                                        </Link>
                                        {/* Heart icon (remove from wishlist) */}
                                        <button
                                            className="position-absolute top-0 end-0 m-3 btn btn-light rounded-circle p-2"
                                            style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            onClick={() => removeFromWishlist(item.product_id)}
                                            aria-label="Remove from wishlist"
                                        >
                                            <FaHeart size={16} className="text-danger" />
                                        </button>
                                        {isLowStock && !isOutOfStock && (
                                            <span className="position-absolute bottom-0 start-0 m-2 badge bg-warning text-dark rounded-0">ONLY {item.stock_quantity} LEFT</span>
                                        )}
                                        {isOutOfStock && (
                                            <span className="position-absolute bottom-0 start-0 m-2 badge bg-danger rounded-0">OUT OF STOCK</span>
                                        )}
                                    </div>
                                    {/* Body */}
                                    <div className="card-body text-center">
                                        <Link href={`/products/${item.product_id}`} className="text-dark text-decoration-none">
                                            <h5 className="card-title" style={{ fontWeight: 'normal' }}>{item.name}</h5>
                                        </Link>
                                        <div className="mb-2">
                                            <span className="fw-bold">${item.price}</span>
                                            {item.compare_price && (
                                                <span className="text-muted ms-2"><del>${item.compare_price}</del></span>
                                            )}
                                        </div>
                                        <button
                                            className="btn btn-dark rounded-0 w-100"
                                            onClick={() => handleMoveToBag(item)}
                                            disabled={isOutOfStock}
                                        >
                                            MOVE TO BAG <FaArrowRight size={12} className="ms-2" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
