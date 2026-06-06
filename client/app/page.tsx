'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaStar, FaRegStar, FaStarHalfAlt, FaArrowRight, FaCheckCircle } from 'react-icons/fa';
import axiosInstance from '@/utils/axiosConfig';
import { useCart } from '@/context/CartContext';

interface Product {
    id: number;
    name: string;
    price: number;
    compare_price?: number;
    images: { image_url: string; is_primary: boolean }[];
    stock_quantity: number;
}

export default function HomePage() {
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);
    const { addToCart } = useCart();

    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [bestSellers, setBestSellers] = useState<Product[]>([]);
    const [newArrivals, setNewArrivals] = useState<Product[]>([]);
    const [aiRecommended, setAiRecommended] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    const categories = [
        { name: 'BAGGY PANTS', slug: 'baggy-pants', icon: '👖' },
        { name: 'FOOTWEAR', slug: 'footwear', icon: '👟' },
        { name: 'TSHIRT', slug: 'tshirt', icon: '👕' },
        { name: 'DROP SHOULDER', slug: 'drop-shoulder', icon: '👚' },
    ];

    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await axiosInstance.get('/products');
                const allProducts = res.data.data;
                setFeaturedProducts(allProducts.slice(0, 2));
                setBestSellers(allProducts.slice(2, 5));
                setNewArrivals(allProducts.slice(5, 8));
                setAiRecommended(allProducts.slice(8, 12));
            } catch (error) {
                console.error('Failed to fetch products', error);
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
            setEmail('');
            setTimeout(() => setSubscribed(false), 3000);
        }
    };

    const getPrimaryImage = (product: Product) => {
        const primary = product.images?.find(img => img.is_primary);
        const imagePath = primary?.image_url || product.images?.[0]?.image_url;
        if (!imagePath) return '/images/placeholders/placeholder.jpg';
        if (imagePath.startsWith('/uploads')) return `${backendUrl}${imagePath}`;
        return imagePath;
    };

    // Updated: add to cart passes name, price, image for guest cart
    const handleAddToCart = async (product: Product) => {
        const imageUrl = getPrimaryImage(product);
        await addToCart(product.id, 1, {
            name: product.name,
            price: product.price,
            image: imageUrl,
        });
    };

    const renderStars = (rating: number = 5) => {
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

    if (loading) {
        return <div className="container py-5 text-center"><div className="spinner-border text-dark" /></div>;
    }

    return (
        <>
            {/* Hero Section */}
            <div className="hero-section bg-light d-flex align-items-center" style={{ minHeight: '70vh', background: 'linear-gradient(135deg, #f5f0eb 0%, #e8e0d8 100%)' }}>
                <div className="container">
                    <div className="row align-items-center">
                        <div className="col-lg-6">
                            <h1 className="display-1 fw-bold mb-3">Light as Air</h1>
                            <p className="lead mb-4">Discover effortless style and breathable comfort.</p>
                            <Link href="/products?new=true" className="btn btn-dark btn-lg rounded-0 px-5 py-3">
                                SHOP NEW ARRIVALS <FaArrowRight className="ms-2" />
                            </Link>
                        </div>
                        <div className="col-lg-6 text-center">
                            <div className="bg-white rounded-circle mx-auto d-flex align-items-center justify-content-center" style={{ width: 300, height: 300, boxShadow: '0 20px 30px -10px rgba(0,0,0,0.1)' }}>
                                <span className="display-1">🪶</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Featured Products */}
            {featuredProducts.length > 0 && (
                <div className="container py-5">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h2 className="fw-bold">Featured</h2>
                        <Link href="/products" className="text-dark text-decoration-none">View All →</Link>
                    </div>
                    <div className="row g-4">
                        {featuredProducts.map((product) => (
                            <div key={product.id} className="col-md-6">
                                <div className="card border-0 shadow-sm h-100">
                                    <Link href={`/products/${product.id}`}>
                                        <div className="d-flex align-items-center justify-content-center p-3" style={{ height: '300px', cursor: 'pointer', backgroundColor: '#fff' }}>
                                            <img
                                                src={getPrimaryImage(product)}
                                                alt={product.name}
                                                className="img-fluid"
                                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                            />
                                        </div>
                                    </Link>
                                    <div className="card-body text-center">
                                        <Link href={`/products/${product.id}`} className="text-dark text-decoration-none">
                                            <h5 className="card-title">{product.name}</h5>
                                        </Link>
                                        <p className="card-text fw-bold">${product.price}</p>
                                        <button className="btn btn-outline-dark rounded-0 px-4" onClick={() => handleAddToCart(product)}>Add to Cart</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Shop by Category */}
            <div className="bg-light py-5">
                <div className="container">
                    <h2 className="fw-bold text-center mb-5">Shop by Category</h2>
                    <div className="row g-4">
                        {categories.map((cat) => (
                            <div key={cat.slug} className="col-md-3 col-6">
                                <Link href={`/categories/${cat.slug}`} className="text-decoration-none">
                                    <div className="card border-0 text-center bg-transparent">
                                        <div className="bg-white rounded-circle mx-auto d-flex align-items-center justify-content-center" style={{ width: 120, height: 120 }}>
                                            <span style={{ fontSize: 48 }}>{cat.icon}</span>
                                        </div>
                                        <div className="card-body">
                                            <h5 className="card-title text-dark">{cat.name}</h5>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Best Sellers */}
            {bestSellers.length > 0 && (
                <div className="container py-5">
                    <h2 className="fw-bold mb-4">Best Sellers</h2>
                    <div className="row g-4">
                        {bestSellers.map((product) => (
                            <div key={product.id} className="col-md-4">
                                <div className="card border-0 shadow-sm h-100">
                                    <Link href={`/products/${product.id}`}>
                                        <div className="d-flex align-items-center justify-content-center p-3" style={{ height: '250px', cursor: 'pointer', backgroundColor: '#fff' }}>
                                            <img
                                                src={getPrimaryImage(product)}
                                                alt={product.name}
                                                className="img-fluid"
                                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                            />
                                        </div>
                                    </Link>
                                    <div className="card-body text-center">
                                        <Link href={`/products/${product.id}`} className="text-dark text-decoration-none">
                                            <h5 className="card-title">{product.name}</h5>
                                        </Link>
                                        <p className="card-text fw-bold">${product.price}</p>
                                        <button className="btn btn-sm btn-outline-dark rounded-0" onClick={() => handleAddToCart(product)}>Add to Cart</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* New Arrivals */}
            {newArrivals.length > 0 && (
                <div className="bg-white py-5">
                    <div className="container">
                        <h2 className="fw-bold mb-4">New Arrivals</h2>
                        <div className="row g-4">
                            {newArrivals.map((product) => (
                                <div key={product.id} className="col-md-4">
                                    <div className="card border-0 shadow-sm h-100">
                                        <Link href={`/products/${product.id}`}>
                                            <div className="d-flex align-items-center justify-content-center p-3 position-relative" style={{ height: '250px', cursor: 'pointer', backgroundColor: '#fff' }}>
                                                <span className="badge bg-danger position-absolute top-0 start-0 m-2 rounded-0">NEW</span>
                                                <img
                                                    src={getPrimaryImage(product)}
                                                    alt={product.name}
                                                    className="img-fluid"
                                                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                                />
                                            </div>
                                        </Link>
                                        <div className="card-body text-center">
                                            <Link href={`/products/${product.id}`} className="text-dark text-decoration-none">
                                                <h5>{product.name}</h5>
                                            </Link>
                                            <p className="mb-0">
                                                <span className="fw-bold">${product.price}</span>
                                                {product.compare_price && <span className="text-muted ms-2"><del>${product.compare_price}</del></span>}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* AI Recommended */}
            {aiRecommended.length > 0 && (
                <div className="container py-5">
                    <div className="d-flex align-items-center mb-4">
                        <span className="badge bg-info text-dark me-2 px-3 py-2 rounded-0">✨ AI PICK</span>
                        <h2 className="fw-bold mb-0">Recommended for You</h2>
                    </div>
                    <div className="row g-4">
                        {aiRecommended.map((product) => (
                            <div key={product.id} className="col-md-4 col-lg-3">
                                <div className="card border-0 shadow-sm h-100">
                                    <Link href={`/products/${product.id}`}>
                                        <div className="d-flex align-items-center justify-content-center p-3" style={{ height: '200px', cursor: 'pointer', backgroundColor: '#fff' }}>
                                            <img
                                                src={getPrimaryImage(product)}
                                                alt={product.name}
                                                className="img-fluid"
                                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                            />
                                        </div>
                                    </Link>
                                    <div className="card-body text-center">
                                        <Link href={`/products/${product.id}`} className="text-dark text-decoration-none">
                                            <h6>{product.name}</h6>
                                        </Link>
                                        <p className="fw-bold">${product.price}</p>
                                        <button className="btn btn-outline-dark btn-sm rounded-0 w-100" onClick={() => handleAddToCart(product)}>Add to Cart</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Customer Reviews (static) */}
            <div className="bg-light py-5">
                <div className="container text-center">
                    <div className="mb-3">{renderStars(5)}</div>
                    <p className="fs-3 fst-italic">"The quality of the linen is unmatched. It truly feels like wearing air."</p>
                    <p className="fw-bold">— Olivia Chen</p>
                    <div className="mt-3">
                        <FaCheckCircle className="text-success me-2" />
                        <span>Verified Customer · 5,000+ Happy Customers</span>
                    </div>
                </div>
            </div>

            {/* Newsletter */}
            <div className="container py-5">
                <div className="row justify-content-center">
                    <div className="col-md-8 text-center">
                        <h2 className="fw-bold">Stay in the Air</h2>
                        <p className="mb-4 text-muted">Receive exclusive access to new drops and stories.</p>
                        {subscribed ? (
                            <div className="alert alert-success">Thank you for subscribing!</div>
                        ) : (
                            <form onSubmit={handleSubscribe} className="row g-2 justify-content-center">
                                <div className="col-sm-8">
                                    <input type="email" className="form-control form-control-lg rounded-0" placeholder="EMAIL ADDRESS" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                </div>
                                <div className="col-sm-auto">
                                    <button type="submit" className="btn btn-dark btn-lg rounded-0 px-5">SUBSCRIBE</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}