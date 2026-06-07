'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import axiosInstance from '@/utils/axiosConfig';
import { useCart } from '@/context/CartContext';

interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string;
}

interface Product {
    id: number;
    name: string;
    price: number;
    compare_price?: number;
    images: { image_url: string; is_primary: boolean }[];
    stock_quantity: number;
}

export default function CategoryProductsPage() {
    const params = useParams();
    const slug = params.slug as string;
    const { addToCart } = useCart();

    const [category, setCategory] = useState<Category | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

    useEffect(() => {
        const fetchCategoryAndProducts = async () => {
            try {
                const categoriesRes = await axiosInstance.get('/categories');
                const categories = categoriesRes.data.data;
                const found = categories.find((c: Category) => c.slug === slug);
                if (!found) {
                    setError('Category not found');
                    setLoading(false);
                    return;
                }
                setCategory(found);
                const productsRes = await axiosInstance.get(`/products?categoryId=${found.id}`);
                setProducts(productsRes.data.data);
            } catch (err) {
                console.error(err);
                setError('Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        if (slug) fetchCategoryAndProducts();
    }, [slug]);

    const handleAddToCart = (product: Product) => {
        addToCart(product.id, 1);
    };

    const getPrimaryImage = (product: Product) => {
        const primary = product.images?.find(img => img.is_primary);
        const imagePath = primary?.image_url || product.images?.[0]?.image_url;
        if (!imagePath) return '/images/placeholders/placeholder.jpg';
        if (imagePath.startsWith('/uploads')) {
            return `${backendUrl}${imagePath}`;
        }
        return imagePath;
    };

    if (loading) {
        return <div className="container py-5 text-center"><div className="spinner-border text-dark" /></div>;
    }
    if (error || !category) {
        notFound();
    }

    return (
        <div className="container py-5">
            <div className="text-center mb-5">
                <h1 className="display-5 fw-bold">{category!.name}</h1>
                {category!.description && <p className="lead text-muted">{category!.description}</p>}
                <p className="text-muted">{products.length} {products.length === 1 ? 'item' : 'items'}</p>
            </div>
            {products.length === 0 ? (
                <div className="text-center py-5">
                    <div className="display-1 mb-3">🕊️</div>
                    <h3>No products yet</h3>
                    <p className="text-muted">Check back soon for new arrivals in {category!.name}.</p>
                    <Link href="/" className="btn btn-dark rounded-0 mt-3">Continue Shopping</Link>
                </div>
            ) : (
                <div className="row g-4">
                    {products.map((product) => (
                        <div key={product.id} className="col-md-4 col-lg-3">
                            <div className="card border-0 shadow-sm h-100 rounded-0">
                                <Link href={`/products/${product.id}`}>
                                    <div className="d-flex align-items-center justify-content-center overflow-hidden" style={{ aspectRatio: '1 / 1', cursor: 'pointer', backgroundColor: '#fff' }}>
                                        <img
                                            src={getPrimaryImage(product)}
                                            alt={product.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </div>
                                </Link>
                                <div className="card-body text-center">
                                    <Link href={`/products/${product.id}`} className="text-dark text-decoration-none">
                                        <h6 className="card-title">{product.name}</h6>
                                    </Link>
                                    <div className="mb-2">
                                        <span className="fw-bold">${product.price}</span>
                                        {product.compare_price && <span className="text-muted ms-2"><del>${product.compare_price}</del></span>}
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
