'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaSearch, FaArrowLeft } from 'react-icons/fa';
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

    const handleAddToCart = (product: Product) => {
        addToCart(product.id, 1);
    };

    const getPrimaryImage = (product: Product) => {
        const primary = product.images?.find(img => img.is_primary);
        const imagePath = primary?.image_url || product.images?.[0]?.image_url;
        if (!imagePath) return '/images/placeholders/placeholder.jpg';
        if (imagePath.startsWith('/uploads')) return `${backendUrl}${imagePath}`;
        return imagePath;
    };

    if (!query) {
        return (
            <div className="container py-5 text-center">
                <div className="display-1 mb-3">🔍</div>
                <h2>No search term entered</h2>
                <p className="text-muted mb-4">Please enter a product name to search.</p>
                <Link href="/" className="btn btn-dark rounded-0 px-4">Back to Home</Link>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-dark" role="status"></div>
                <p className="mt-3 text-muted">Searching for "{query}"...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container py-5 text-center">
                <h2>Something went wrong</h2>
                <p className="text-muted">{error}</p>
                <Link href="/" className="btn btn-dark rounded-0">Back to Home</Link>
            </div>
        );
    }

    return (
        <div className="container py-5">
            {/* Header with search info */}
            <div className="mb-4">
                <div className="d-flex align-items-center gap-3 mb-2">
                    <button onClick={() => router.back()} className="btn btn-link text-dark p-0">
                        <FaArrowLeft size={20} />
                    </button>
                    <h1 className="fw-bold mb-0">Search Results</h1>
                </div>
                <p className="text-muted">
                    {products.length} {products.length === 1 ? 'result' : 'results'} for "{query}"
                </p>
            </div>

            {products.length === 0 ? (
                <div className="text-center py-5">
                    <div className="display-1 mb-3">🔍</div>
                    <h3>No products found</h3>
                    <p className="text-muted">We couldn't find any products matching "{query}".</p>
                    <p className="text-muted">Try different keywords or browse our categories.</p>
                    <Link href="/categories" className="btn btn-outline-dark rounded-0 mt-3">Browse Categories</Link>
                </div>
            ) : (
                <div className="row g-4">
                    {products.map((product) => (
                        <div key={product.id} className="col-md-6 col-lg-4 col-xl-3">
                            <div className="card border-0 shadow-sm h-100 rounded-0">
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
                                        <h6 className="card-title">{product.name}</h6>
                                    </Link>
                                    <p className="text-muted small">{product.category_name}</p>
                                    <div className="mb-2">
                                        <span className="fw-bold">${product.price}</span>
                                        {product.compare_price && (
                                            <span className="text-muted ms-2"><del>${product.compare_price}</del></span>
                                        )}
                                    </div>
                                    <button
                                        className="btn btn-sm btn-outline-dark rounded-0 w-100"
                                        onClick={() => handleAddToCart(product)}
                                        disabled={product.stock_quantity === 0}
                                    >
                                        {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="container py-5 text-center"><div className="spinner-border text-dark" /></div>}>
            <SearchResultsContent />
        </Suspense>
    );
}